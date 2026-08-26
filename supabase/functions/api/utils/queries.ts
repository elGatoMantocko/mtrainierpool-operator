export const POOL_UPDATES_FIELDS = `id
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
    closedAt:closed_at,
    openedAt:opened_at,
    reasoning,
    confidenceScore:confidence_score,
    flags,
    createdAt:created_at,
    updatedAt:updated_at
  )
)`;

export const POOL_OPERATOR_ANALYSIS_FIELDS = `id
, poolUpdate:pool_updates(id, message, source)
, closures:pool_closures(closed_at, opened_at, reasoning)`;
