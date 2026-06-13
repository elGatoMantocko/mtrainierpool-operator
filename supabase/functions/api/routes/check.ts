import "@supabase/functions-js/edge-runtime.d.ts";

// deno check (TS 6, moduleDetection: auto) treats edge-runtime.d.ts as a module
// because of "type":"module" in the JSR compat shim, so the ambient import above
// doesn't propagate globals. Declare them explicitly at module scope as a workaround.
declare const Supabase: {
  ai: {
    Session: {
      new (model: string): {
        run(
          prompt: string | Record<string, unknown>,
          options?: {
            stream?: boolean;
            timeout?: number;
            mode?: string;
            signal?: AbortSignal;
          },
        ): unknown;
      };
    };
  };
};
declare const EdgeRuntime: {
  waitUntil<T>(promise: Promise<T>): Promise<T>;
};

import { DOMParser } from "@b-fuze/deno-dom";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import * as uuid from "@std/uuid";
import { withSupabase } from "@supabase/server/adapters/hono";
import { Context } from "hono";
import { Buffer } from "node:buffer";

import { SupabaseVariables } from "@/index.ts";
import type { TablesInsert } from "@/types/database.types.ts";

const NAMESPACE_POOL_CLOSURE = await uuid.v5.generate(
  uuid.NAMESPACE_URL,
  Buffer.from("@mycah/pool-closure", "utf8"),
);

const Analysis = z.object({
  id: z.uuid(),
  poolUpdateId: z.uuid(),
  closureDate: z.iso.date().nullable(),
  reopeningDate: z.iso.date().nullable(),
  reasoning: z.string().nullable(),
  confidenceScore: z.int().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable(),
  flags: z.array(z.string()),
});

const StatusUpdate = z.object({
  id: z.uuid(),
  message: z.string(),
  source: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  poolClosureAnalysis: Analysis.nullable(),
}).openapi("StatusUpdate", {
  description: "A Mt. Rainier pool status update.",
});

const route = createRoute({
  operationId: "check",
  method: "get",
  path: "/",
  security: [{ SupabaseAuth: [] }],
  // don't use `as const` because this type doesn't fully support DB types
  // publishable or secret imply supabaseAdmin
  middleware: [withSupabase({ auth: ["secret"] })],
  responses: {
    200: {
      description: "Found a pool status update.",
      content: {
        "application/json": {
          schema: StatusUpdate,
        },
      },
    },
    204: {
      description: "No status update available.",
    },
    500: {
      description: "Internal server error.",
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
    },
  },
});

interface LLMAnalysis {
  closure_date: string | null;
  reopening_date: string | null;
  confidence_score: number | null;
  reasoning: string | null;
  flags: string[];
}

function isLLMAnalysis(obj: unknown): obj is LLMAnalysis {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "closure_date" in obj &&
    "reopening_date" in obj &&
    "confidence_score" in obj &&
    typeof obj.confidence_score === "number" &&
    "reasoning" in obj &&
    "flags" in obj &&
    Array.isArray(obj.flags)
  );
}

type PoolClosureAnalysis = TablesInsert<
  { schema: "public" },
  "pool_closure_analysis"
>;

function sanitize<T extends string | null>(data: T): T {
  let cleaned = data;
  if (cleaned?.startsWith("\`\`\`json")) cleaned = cleaned.slice(6) as T;
  if (cleaned?.endsWith("\`\`\`")) cleaned = cleaned.slice(0, -3) as T;
  if (cleaned?.toLowerCase() === "null") cleaned = null as T;
  return cleaned;
}

function sanitizeDate<T extends string | null>(date: T): T {
  let cleaned = sanitize(date);
  if (cleaned?.toLowerCase() === "tbd") cleaned = null as T;
  return cleaned;
}

function getPrompt(bannerText: string): string {
  const today = Temporal.Now.plainDateISO("America/Los_Angeles");
  const weekday = today.toLocaleString("en-US", { weekday: "long" });
  return `Today's date: ${today} (${weekday})\n\nPool update message: ${bannerText}`;
}

async function runPoolOperator<C extends Context<SupabaseVariables>>(
  c: C,
  poolClosureId: string,
  bannerText: string,
) {
  console.log("biginning LLM analysis");
  const session = new Supabase.ai.Session("pool-operator");
  const prompt = getPrompt(bannerText);

  console.log(`sending prompt: \`${prompt}\``);
  const output = await session.run(prompt, {
    timeout: 300,
  }) as unknown as {
    response: string;
  };

  console.log(`received response: \`${output.response}\``);
  const structured = JSON.parse(sanitize(output.response));
  if (!isLLMAnalysis(structured)) {
    console.error("invalid analysis response", structured);
    return;
  }

  const reasoning = sanitize(structured.reasoning);
  const closure_date = sanitizeDate(structured.closure_date);
  const reopening_date = sanitizeDate(structured.reopening_date);
  const flags = structured.flags
    .map((f) => sanitize(f))
    .filter((f) => f != null);

  const toUpsert: PoolClosureAnalysis = {
    pool_update_id: poolClosureId,
    confidence_score: structured.confidence_score,
    reasoning,
    closure_date,
    reopening_date,
    flags,
  };

  const { data, error } = await c.var.supabaseContext.supabaseAdmin
    .from("pool_closure_analysis")
    .upsert(toUpsert, { onConflict: "pool_update_id" })
    .select()
    .single();
  if (error) {
    console.error("failed to upsert analysis", error);
  }
  console.log("upserted LLM analysis", data);
}

export const app = new OpenAPIHono<SupabaseVariables>().openapi(
  route,
  async (c) => {
    const res = await fetch("https://mtrainierpool.com");
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "text/html");
    const updatesBannerParagraph = doc.querySelector("#updates_banner p");

    // get the text from the banner and print it
    const bannerText = updatesBannerParagraph?.textContent.trim();

    if (bannerText == null) {
      return c.body(null, 204);
    }

    // dedupe messages by using uuid5
    const id = await uuid.v5.generate(
      NAMESPACE_POOL_CLOSURE,
      Buffer.from(bannerText, "utf8"),
    );
    const { data, error } = await c.var.supabaseContext.supabaseAdmin
      .from("pool_updates")
      .upsert({ id, message: bannerText, source: "mtrainierpool.com" })
      .select(
        `id
        ,message
        ,source
        ,createdAt:created_at
        ,updatedAt:updated_at
        ,poolClosureAnalysis:pool_closure_analysis(
          id,
          poolUpdateId:pool_update_id,
          closureDate:closure_date,
          reopeningDate:reopening_date,
          reasoning,
          confidenceScore:confidence_score,
          createdAt:created_at,
          updatedAt:updated_at,
          flags
        )`,
      )
      .single();

    if (error) {
      throw new Error("failed to create new pool closure record", {
        cause: error,
      });
    }

    console.log("got a pool update", data);

    // need to run and apply an analysis
    if (data.poolClosureAnalysis == null) {
      EdgeRuntime.waitUntil(runPoolOperator(c, data.id, bannerText));
    }

    return c.json(data, 200);
  },
);
