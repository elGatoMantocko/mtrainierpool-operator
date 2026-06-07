select
  net.http_get(
      url:= (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/api/check',
      headers:=format('{"Content-Type": "application/json", "apikey": "%s"}', (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'))::jsonb
  ) as request_id;
