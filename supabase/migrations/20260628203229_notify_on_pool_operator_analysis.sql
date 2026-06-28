-- Move the closure-notification trigger onto the pool_operator_analysis model.
--
-- Notifications previously fired AFTER INSERT on pool_closure_analysis, which the
-- /api/check route no longer writes (it now writes pool_operator_analysis +
-- pool_closures). They must instead fire when a new pool_operator_analysis is
-- ingested *and* that analysis produced at least one pool_closures row.
--
-- The catch: the analysis (parent) and its closures (children) are written in
-- sequence. A plain AFTER INSERT trigger on the parent runs before the closures
-- exist, so it could never answer "does this analysis have closures?". To fix the
-- ordering we (a) ingest both in a single transaction via the RPC below, and
-- (b) make the notify trigger DEFERRABLE INITIALLY DEFERRED so it runs at COMMIT,
-- once the closures inserted in the same transaction are visible.

set check_function_bodies = off;

-- Single-transaction ingest: upsert the analysis parent and all of its closures
-- together so the deferred notify trigger observes a consistent state. Called by
-- the /api/check edge function with the service role key.
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
    analysis_id, closure_date, reopening_date, confidence_score, reasoning, flags
  )
  select
    v_analysis_id,
    nullif(c->>'closure_date', '')::timestamptz,
    nullif(c->>'reopening_date', '')::timestamptz,
    (c->>'confidence_score')::smallint,
    c->>'reasoning',
    coalesce(
      array(select jsonb_array_elements_text(c->'flags')),
      '{}'::text[]
    )
  from jsonb_array_elements(coalesce(p_closures, '[]'::jsonb)) as c
  on conflict (analysis_id, closure_date, reopening_date)
    do update set
      confidence_score = excluded.confidence_score,
      reasoning = excluded.reasoning,
      flags = excluded.flags;

  return v_analysis_id;
end;
$function$
;

-- RPC is invoked with the service role key from the edge function; keep it off the
-- Data API for anon/authenticated (CREATE grants EXECUTE to PUBLIC by default).
revoke execute on function public.ingest_pool_operator_analysis(uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.ingest_pool_operator_analysis(uuid, text, jsonb)
  to service_role;

-- Rework the notify trigger function: it now keys off a pool_operator_analysis
-- row and only fires when that analysis actually produced closures. Sends the
-- analysis id (also the delivery idempotency key) to the notify/email route.
create or replace function public.notify_pool_closure_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_project_url text;
  v_service_role_key text;
begin
  -- No closures extracted -> pool isn't closed -> nothing to notify.
  if not exists (
    select 1 from public.pool_closures where analysis_id = new.id
  ) then
    return null;
  end if;

  select decrypted_secret into v_project_url
  from vault.decrypted_secrets where name = 'project_url';

  select decrypted_secret into v_service_role_key
  from vault.decrypted_secrets where name = 'service_role_key';

  perform net.http_post(
    url := v_project_url || '/functions/v1/api/notify/email',
    body := jsonb_build_object('analysisId', new.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_service_role_key
    )
  );

  return null;
end;
$function$
;

-- Old trigger fired on the deprecated pool_closure_analysis table.
drop trigger if exists notify_pool_closure_email on public.pool_closure_analysis;

-- Deferred constraint trigger: runs at COMMIT, after ingest_pool_operator_analysis
-- has inserted the closures in the same transaction. Only fires on INSERT, so a
-- re-analysis (which upserts the existing analysis row) won't re-notify.
drop trigger if exists notify_pool_closure_email on public.pool_operator_analysis;
create constraint trigger notify_pool_closure_email
  after insert on public.pool_operator_analysis
  deferrable initially deferred
  for each row
  execute function public.notify_pool_closure_email();
