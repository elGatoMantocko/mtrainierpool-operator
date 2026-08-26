import type { Context } from "hono";

import type { SupabaseContext } from "@supabase/server";

import type { Database, TablesInsert } from "@/types/database.types.ts";

export function getPrompt(bannerText: string): string {
  const now = Temporal.Now.zonedDateTimeISO("America/Los_Angeles");
  const weekday = now.toLocaleString("en-US", { weekday: "long" });
  // ISO 8601 timestamp with offset, e.g. 2026-06-28T14:30:00-07:00
  const nowIso = now.toString({
    timeZoneName: "never",
    smallestUnit: "second",
  });
  return `Current date and time: ${nowIso} (${weekday}, timezone` +
    ` America/Los_Angeles, UTC offset ${now.offset})` +
    `\n\nPool update message: ${bannerText}`;
}

// analysis_id is assigned by the ingest RPC, so the payload omits it.
type PoolClosureInsert = Omit<TablesInsert<"pool_closures">, "analysis_id">;

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

type SupabaseHonoContext = Context<
  { Variables: { supabaseContext: SupabaseContext<Database> } }
>;

export async function runPoolOperator<
  C extends SupabaseHonoContext,
>(
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

  const cleaned = structured.map((item) => ({
    reasoning: sanitize(item.reasoning),
    closed_at: sanitize(item.closure_date),
    opened_at: sanitize(item.reopening_date),
    confidence_score: item.confidence_score,
    flags: item.flags
      .map((f) => sanitize(f))
      .filter((f) => f != null),
  } satisfies PoolClosureInsert)).filter((item) =>
    // only include items with closure or reopening dates
    // if both are null, the item is likely not relevant
    item.closed_at != null || item.opened_at != null
  );

  // Ingest the analysis and its closures in a single transaction (RPC) so the
  // deferred notify trigger on pool_operator_analysis fires at COMMIT with the
  // closures already visible. See migration notify_on_pool_operator_analysis.
  const { data: analysisId, error: ingestError } = await c.var
    .supabaseContext.supabaseAdmin
    /*
     * TODO: add a "reasoning" field to the analysis to give it distinct
     * overview when there are no closures.
     */
    .rpc("ingest_pool_operator_analysis", {
      p_pool_update_id: poolUpdateId,
      p_model: output.model,
      p_closures: cleaned,
    });

  if (ingestError) {
    console.error("failed to ingest pool operator analysis", ingestError);
    return;
  }

  console.log("ingested LLM analysis", analysisId);
}
