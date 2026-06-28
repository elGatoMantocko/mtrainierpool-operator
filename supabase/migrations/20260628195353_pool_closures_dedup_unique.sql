-- Dedup key for pool_closures upserts.
--
-- The /api/check route upserts closures with
-- onConflict: "analysis_id,closure_date,reopening_date", which requires a
-- matching unique constraint or Postgres raises 42P10.
--
-- NULLS NOT DISTINCT is required: closure_date / reopening_date are nullable
-- (e.g. a standalone late opening has a null closure_date), and the default
-- NULLS DISTINCT behavior would treat two otherwise-identical null-bearing rows
-- as unique, so re-running the operator would insert duplicates instead of
-- deduping. NULLS NOT DISTINCT makes a null match a null for this constraint.
ALTER TABLE ONLY "public"."pool_closures"
    ADD CONSTRAINT "pool_closures_analysis_id_closure_date_reopening_date_key"
    UNIQUE NULLS NOT DISTINCT ("analysis_id", "closure_date", "reopening_date");
