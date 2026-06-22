-- Resolves linters 0028 / 0029 (anon_/authenticated_security_definer_function_executable).
-- Postgres grants EXECUTE to PUBLIC by default, so these SECURITY DEFINER
-- functions are callable as RPC endpoints by anon and authenticated. Both are
-- invoked only by triggers (a row trigger on net._http_response and the
-- rls_auto_enable event trigger) -- trigger firing does not require the EXECUTE
-- privilege, so revoking it has no functional impact.
revoke execute on function public.log_net_http_response() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
