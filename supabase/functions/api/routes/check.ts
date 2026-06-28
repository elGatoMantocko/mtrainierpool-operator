import { DOMParser } from "@b-fuze/deno-dom";
import { createRoute, z } from "@hono/zod-openapi";
import * as uuid from "@std/uuid";
import { withSupabase } from "@supabase/server/adapters/hono";
import { Context } from "hono";
import { Buffer } from "node:buffer";

import { SupabaseVariables } from "@/index.ts";
import type { TablesInsert } from "@/types/database.types.ts";
import { DefaultOpenAPIHono } from "@/utils/hono.ts";

const NAMESPACE_POOL_CLOSURE = await uuid.v5.generate(
  uuid.NAMESPACE_URL,
  Buffer.from("@mycah/pool-closure", "utf8"),
);

const PoolClosure = z.object({
  id: z.uuid(),
  closureDate: z.iso.datetime().nullable(),
  reopeningDate: z.iso.datetime().nullable(),
  reasoning: z.string().nullable(),
  confidenceScore: z.int().nullable(),
  flags: z.array(z.string()),
});

const Analysis = z.object({
  id: z.uuid(),
  model: z.string().nullable(),
  closures: z.array(PoolClosure),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable(),
});

const StatusUpdate = z.object({
  id: z.uuid(),
  message: z.string().nullable(),
  source: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable(),
  analysis: Analysis.nullable(),
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

type PoolClosureUpsert = TablesInsert<"pool_closures">;

interface LLMAnalysis {
  closure_date: string | null;
  reopening_date: string | null;
  confidence_score: number | null;
  reasoning: string | null;
  flags: string[];
}

function isLLMAnalysis(obj: unknown): obj is LLMAnalysis[] {
  return (
    Array.isArray(obj) &&
    obj.every((item) =>
      typeof item === "object" &&
      item !== null &&
      "closure_date" in item &&
      "reopening_date" in item &&
      "confidence_score" in item &&
      typeof item.confidence_score === "number" &&
      "reasoning" in item &&
      "flags" in item &&
      Array.isArray(item.flags)
    )
  );
}

function sanitize<T extends string | null>(data: T): T {
  let cleaned = data;
  if (cleaned?.startsWith("\`\`\`json")) cleaned = cleaned.slice(6) as T;
  if (cleaned?.endsWith("\`\`\`")) cleaned = cleaned.slice(0, -3) as T;
  if (cleaned?.toLowerCase() === "null") cleaned = null as T;
  return cleaned;
}

export function getPrompt(bannerText: string): string {
  const now = Temporal.Now.zonedDateTimeISO("America/Los_Angeles");
  const weekday = now.toLocaleString("en-US", { weekday: "long" });
  // ISO 8601 timestamp with offset, e.g. 2026-06-28T14:30:00-07:00
  const nowIso = now.toString({
    timeZoneName: "never",
    smallestUnit: "second",
  });
  return `Current date and time: ${nowIso} (${weekday}, timezone America/Los_Angeles, UTC offset ${now.offset})\n\nPool update message: ${bannerText}`;
}

async function runPoolOperator<C extends Context<SupabaseVariables>>(
  c: C,
  poolUpdateId: string,
  bannerText: string,
) {
  console.log("biginning LLM analysis");
  const session = new Supabase.ai.Session("pool-operator");
  const prompt = getPrompt(bannerText);

  console.log(`sending prompt: \`${prompt}\``);
  const output = await session.run(prompt, {
    timeout: 300,
  }) as unknown as {
    model: string;
    response: string;
  };

  console.log(`received response: \`${output.response}\``);
  const structured = JSON.parse(sanitize(output.response));
  if (!isLLMAnalysis(structured)) {
    console.error("invalid analysis response", structured);
    return;
  }

  const { data: analysisUpsert, error: analysisError } = await c.var
    .supabaseContext.supabaseAdmin
    .from("pool_operator_analysis")
    .upsert({ pool_update_id: poolUpdateId, model: output.model }, {
      onConflict: "pool_update_id",
    })
    .select("id")
    .single();

  if (analysisError) {
    console.error("failed to upsert analysis", analysisError);
    return;
  }

  const cleaned = structured.map((item) => ({
    ...item,
    analysis_id: analysisUpsert.id,
    reasoning: sanitize(item.reasoning),
    closure_date: sanitize(item.closure_date),
    reopening_date: sanitize(item.reopening_date),
    flags: item.flags
      .map((f) => sanitize(f))
      .filter((f) => f != null),
  } satisfies PoolClosureUpsert));

  const { data: closureUpsert, error: closureError } = await c.var
    .supabaseContext.supabaseAdmin
    .from("pool_closures")
    .upsert(cleaned, { onConflict: "analysis_id,closure_date,reopening_date" })
    .select(
      `*
      , poolOperatorAnalysis:pool_operator_analysis(
        *
        , poolUpdate:pool_updates(
          *
        )
      )`,
    );
  if (closureError) {
    console.error("failed to upsert analysis", closureError);
  }
  if (!closureUpsert) {
    console.log("no new analysis to perform");
    return null;
  }

  console.log("upserted LLM analysis", closureUpsert);
}

export const app = new DefaultOpenAPIHono<SupabaseVariables>().openapi(
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
        ,analysis:pool_operator_analysis(
          id,
          model,
          createdAt:created_at,
          updatedAt:updated_at,
          closures:pool_closures(
            id,
            closureDate:closure_date,
            reopeningDate:reopening_date,
            reasoning,
            confidenceScore:confidence_score,
            flags,
            createdAt:created_at,
            updatedAt:updated_at
          )
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
    if (data.analysis == null) {
      EdgeRuntime.waitUntil(runPoolOperator(c, data.id, bannerText));
    }

    return c.json(data satisfies z.infer<typeof StatusUpdate>, 200);
  },
);
