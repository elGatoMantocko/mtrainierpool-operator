import "@supabase/functions-js/edge-runtime.d.ts";

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

const StatusUpdate = z.object({
  id: z.uuid(),
  message: z.string(),
  source: z.string(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
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

async function runPoolOperator<C extends Context<SupabaseVariables>>(
  c: C,
  poolClosureId: string,
  bannerText: string,
) {
  console.log("biginning LLM analysis");
  const session = new Supabase.ai.Session("pool-operator");
  const output = await session.run(bannerText, { timeout: 300 }) as unknown as {
    response: string;
  };

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
      .upsert({ id, message: bannerText, source: "mtrainierpool.com" }, {
        ignoreDuplicates: true,
      })
      .select()
      .maybeSingle();

    if (error) {
      throw new Error("failed to create new pool closure record", {
        cause: error,
      });
    }

    if (data == null) {
      return c.body(null, 204);
    }

    console.log("found pool closure", data);
    EdgeRuntime.waitUntil(runPoolOperator(c, data.id, bannerText));

    return c.json(data, 200);
  },
);
