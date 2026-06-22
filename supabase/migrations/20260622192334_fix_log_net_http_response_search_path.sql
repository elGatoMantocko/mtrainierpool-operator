-- Resolves database linter 0011 (function_search_path_mutable).
-- log_net_http_response is SECURITY DEFINER, so an unset (mutable) search_path
-- is a privilege-escalation vector. It only uses pg_catalog built-ins and the
-- trigger NEW record, so an empty search_path is safe.
create or replace function public.log_net_http_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.timed_out, false)
     or new.error_msg is not null
     or new.status_code is null
     or new.status_code >= 400
  then
    raise warning 'pg_net request % failed: status=%, error=%, timed_out=%',
      new.id,
      coalesce(new.status_code::text, 'null'),
      coalesce(new.error_msg, 'none'),
      coalesce(new.timed_out, false);
  else
    raise log 'pg_net request % succeeded: status=%', new.id, new.status_code;
  end if;
  return new;
end;
$$;
