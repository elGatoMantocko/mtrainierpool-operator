-- Backfill the deprecated pool_closure_analysis data into the new
-- pool_operator_analysis (1:1 with pool_updates) + pool_closures (1:n) tables.
--
-- For each pool_closure_analysis row:
--   * create one pool_operator_analysis row (the analysis run for that update)
--   * if it carried a closure or reopening date, create one pool_closures row
--     with the original dates/confidence/reasoning/flags
--
-- created_at/updated_at are preserved from the source rows to keep provenance.
-- model is set to 'pool_operator': the legacy rows were all produced by that model.
--
-- Idempotent: the pool_operator_analysis insert is keyed on the unique
-- pool_update_id (ON CONFLICT DO NOTHING), and only newly inserted analyses
-- drive the pool_closures insert, so re-running is a no-op.
with inserted_analysis as (
  insert into public.pool_operator_analysis (pool_update_id, model, created_at, updated_at)
  select pca.pool_update_id, 'pool_operator', pca.created_at, pca.updated_at
  from public.pool_closure_analysis pca
  on conflict (pool_update_id) do nothing
  returning id, pool_update_id
)
insert into public.pool_closures (
  analysis_id, closure_date, reopening_date, confidence_score, reasoning, flags, created_at, updated_at
)
select
  ia.id, pca.closure_date, pca.reopening_date, pca.confidence_score, pca.reasoning, pca.flags,
  pca.created_at, pca.updated_at
from public.pool_closure_analysis pca
join inserted_analysis ia on ia.pool_update_id = pca.pool_update_id
where pca.closure_date is not null or pca.reopening_date is not null;
