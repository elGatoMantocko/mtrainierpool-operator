-- Resolves linters 0026/0027 (pg_graphql_anon/authenticated_table_exposed) for
-- the notification delivery tables. These are internal: they are only written
-- and read by the edge function via the service_role key, never by the
-- frontend's anon/authenticated clients. Revoke all default grants so they are
-- neither queryable nor discoverable through the Data/GraphQL API.
revoke all privileges on table public.notification_deliveries from anon, authenticated;
revoke all privileges on table public.email_deliveries from anon, authenticated;
