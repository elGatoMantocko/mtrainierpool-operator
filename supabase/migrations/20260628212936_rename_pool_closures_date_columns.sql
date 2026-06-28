-- Rename pool_closures date columns to closed_at / opened_at.
--
-- closure_date -> closed_at, reopening_date -> opened_at. These are *at-style
-- timestamptz columns, so the *_at naming now matches the other timestamp
-- columns (created_at / updated_at). Only pool_closures is touched here; the
-- deprecated pool_closure_analysis keeps its closure_date / reopening_date.

ALTER TABLE "public"."pool_closures" RENAME COLUMN "closure_date" TO "closed_at";
ALTER TABLE "public"."pool_closures" RENAME COLUMN "reopening_date" TO "opened_at";

-- Renaming columns leaves the dedup unique constraint name carrying the old
-- column names; rename it too so the schema stays self-describing. The columns
-- it covers follow the rename automatically.
ALTER TABLE "public"."pool_closures"
    RENAME CONSTRAINT "pool_closures_analysis_id_closure_date_reopening_date_key"
    TO "pool_closures_analysis_id_closed_at_opened_at_key";

-- Recreate the ingest RPC against the new column names. The JSONB payload keys
-- sent by the /api/check edge function are renamed to match (closed_at /
-- opened_at), and the ON CONFLICT target tracks the renamed dedup constraint.
set check_function_bodies = off;

create or replace function public.ingest_pool_operator_analysis(
  p_pool_update_id uuid,
  p_model text,
  p_closures jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_analysis_id uuid;
begin
  insert into public.pool_operator_analysis (pool_update_id, model)
  values (p_pool_update_id, p_model)
  on conflict (pool_update_id)
    do update set model = excluded.model
  returning id into v_analysis_id;

  insert into public.pool_closures (
    analysis_id, closed_at, opened_at, confidence_score, reasoning, flags
  )
  select
    v_analysis_id,
    nullif(c->>'closed_at', '')::timestamptz,
    nullif(c->>'opened_at', '')::timestamptz,
    (c->>'confidence_score')::smallint,
    c->>'reasoning',
    coalesce(
      array(select jsonb_array_elements_text(c->'flags')),
      '{}'::text[]
    )
  from jsonb_array_elements(coalesce(p_closures, '[]'::jsonb)) as c
  on conflict (analysis_id, closed_at, opened_at)
    do update set
      confidence_score = excluded.confidence_score,
      reasoning = excluded.reasoning,
      flags = excluded.flags;

  return v_analysis_id;
end;
$function$
;
