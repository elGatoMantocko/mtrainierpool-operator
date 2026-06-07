CREATE EXTENSION IF NOT EXISTS pg_cron;

select
  cron.schedule(
    'pool-check-daily-6am-pst',
    '0 14 * * *', -- 06:00 PST (UTC-8); runs at 07:00 during PDT
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
