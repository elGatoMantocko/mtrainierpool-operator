-- Resolves linter 0026 (pg_graphql_anon_table_exposed) for the pool tables.
-- The frontend reads pool_updates and pool_closure_analysis with the
-- authenticated key (both have SELECT policies scoped TO authenticated); anon
-- is never used and has no policy, so revoking its grants removes pre-sign-in
-- discoverability without affecting the app.
--
-- Note: the matching authenticated exposure (linter 0027) is intentional and
-- left in place -- signed-in users are meant to read pool data.
revoke all privileges on table public.pool_updates from anon;
revoke all privileges on table public.pool_closure_analysis from anon;
