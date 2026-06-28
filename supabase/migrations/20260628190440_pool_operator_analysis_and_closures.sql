-- Support multiple closures per pool update.
--
-- Previously pool_updates was 1:1 with pool_closure_analysis, which could only
-- represent a single closure/reopening per scraped banner. The pool-operator
-- model now emits an array of closure events, so the analysis is split into:
--
--   pool_operator_analysis  -- 1:1 with pool_updates: "this update was analyzed"
--   pool_closures           -- 1:n off an analysis: one row per closure event
--
-- pool_closure_analysis is deprecated (see COMMENT below) but intentionally
-- retained, along with its notify trigger and existing data, until the edge
-- function + frontend are migrated to the new tables.

-- 1:1 with pool_updates. Thin parent that records that the operator ran against
-- a given update; the extracted closures hang off it via pool_closures.
CREATE TABLE IF NOT EXISTS "public"."pool_operator_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pool_update_id" "uuid" NOT NULL,
    "model" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);

ALTER TABLE "public"."pool_operator_analysis" OWNER TO "postgres";

ALTER TABLE ONLY "public"."pool_operator_analysis"
    ADD CONSTRAINT "pool_operator_analysis_pkey" PRIMARY KEY ("id");

-- Enforces the 1:1 relationship with pool_updates.
ALTER TABLE ONLY "public"."pool_operator_analysis"
    ADD CONSTRAINT "pool_operator_analysis_pool_update_id_key" UNIQUE ("pool_update_id");

ALTER TABLE ONLY "public"."pool_operator_analysis"
    ADD CONSTRAINT "pool_operator_analysis_pool_update_id_fkey"
    FOREIGN KEY ("pool_update_id") REFERENCES "public"."pool_updates"("id");

-- One row per distinct closure event extracted from an update. The per-closure
-- confidence/reasoning/flags mirror what the model emits for each array element.
CREATE TABLE IF NOT EXISTS "public"."pool_closures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "analysis_id" "uuid" NOT NULL,
    "closure_date" timestamp with time zone,
    "reopening_date" timestamp with time zone,
    "confidence_score" smallint,
    "reasoning" "text",
    "flags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);

ALTER TABLE "public"."pool_closures" OWNER TO "postgres";

ALTER TABLE ONLY "public"."pool_closures"
    ADD CONSTRAINT "pool_closures_pkey" PRIMARY KEY ("id");

-- Closures belong to their analysis; cascade so re-analysis can replace them cleanly.
ALTER TABLE ONLY "public"."pool_closures"
    ADD CONSTRAINT "pool_closures_analysis_id_fkey"
    FOREIGN KEY ("analysis_id") REFERENCES "public"."pool_operator_analysis"("id") ON DELETE CASCADE;

-- Postgres does not auto-index foreign keys; this one is the join/lookup path.
CREATE INDEX IF NOT EXISTS "pool_closures_analysis_id_idx"
    ON "public"."pool_closures" ("analysis_id");

-- Keep updated_at current on mutation, matching the other public tables.
CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."pool_operator_analysis"
    FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."pool_closures"
    FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

-- RLS + grants mirror pool_closure_analysis: signed-in users may read pool data
-- (intentional authenticated exposure), service_role has full access, anon none.
-- RLS is also auto-enabled by the rls_auto_enable event trigger; set explicitly
-- here so the intent is visible and the schema dump is stable.
ALTER TABLE "public"."pool_operator_analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pool_closures" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can query pool operator analysis."
    ON "public"."pool_operator_analysis" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Authenticated users can query pool closures rows."
    ON "public"."pool_closures" FOR SELECT TO "authenticated" USING (true);

GRANT ALL ON TABLE "public"."pool_operator_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."pool_operator_analysis" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE "public"."pool_operator_analysis" FROM "anon";

GRANT ALL ON TABLE "public"."pool_closures" TO "authenticated";
GRANT ALL ON TABLE "public"."pool_closures" TO "service_role";
REVOKE ALL PRIVILEGES ON TABLE "public"."pool_closures" FROM "anon";

-- Deprecated in favor of pool_operator_analysis + pool_closures. Retained (with
-- its notify_pool_closure_email trigger and data) until downstream is migrated.
COMMENT ON TABLE "public"."pool_closure_analysis" IS
    'DEPRECATED: replaced by pool_operator_analysis (1:1 with pool_updates) + pool_closures (1:n). Retained until the edge function and frontend are migrated.';
