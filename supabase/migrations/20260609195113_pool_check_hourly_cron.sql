select cron.unschedule('pool-check-daily-6am-pst');

select
  cron.schedule(
    'pool-check-hourly',
    '0 * * * *',
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
