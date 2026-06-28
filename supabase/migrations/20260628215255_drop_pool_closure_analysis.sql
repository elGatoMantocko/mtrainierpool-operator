-- The pool_closure_analysis table has been superseded by pool_operator_analysis
-- (+ pool_closures). All application code (check route, notify route, frontend,
-- generated client) has been cut over, and no triggers, foreign keys, views, or
-- functions reference it anymore. Drop it.
drop table if exists public.pool_closure_analysis;
