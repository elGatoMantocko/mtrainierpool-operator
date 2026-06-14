select cron.unschedule('pool-check-10min');

-- every 10 minutes, 2:00am–8:50am PST (10:00–16:50 UTC, PST = UTC-8)
select
  cron.schedule(
    'pool-check-10min',
    '*/10 9-15 * * *',
    $$
    select
      net.http_get(
          url:= (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/api/check',
          headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
          )
      ) as request_id;
    $$
  );
