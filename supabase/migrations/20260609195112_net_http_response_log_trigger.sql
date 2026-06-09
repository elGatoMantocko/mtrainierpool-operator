create or replace function public.log_net_http_response()
returns trigger
language plpgsql
security definer
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

create trigger log_net_http_response
  after insert on net._http_response
  for each row execute function public.log_net_http_response();
