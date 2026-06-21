set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.notify_pool_closure_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_project_url text;
  v_service_role_key text;
begin
  select decrypted_secret into v_project_url
  from vault.decrypted_secrets where name = 'project_url';

  select decrypted_secret into v_service_role_key
  from vault.decrypted_secrets where name = 'service_role_key';

  perform net.http_post(
    url := v_project_url || '/functions/v1/api/notify/email',
    body := jsonb_build_object('poolUpdateId', new.pool_update_id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_service_role_key
    )
  );

  return new;
end;
$function$
;

-- Trigger function is invoked by the trigger mechanism, not the Data API. Undo the
-- schema's default EXECUTE grant to anon/authenticated so it isn't an RPC endpoint.
REVOKE EXECUTE ON FUNCTION public.notify_pool_closure_email() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER notify_pool_closure_email AFTER INSERT ON public.pool_closure_analysis FOR EACH ROW EXECUTE FUNCTION public.notify_pool_closure_email();


