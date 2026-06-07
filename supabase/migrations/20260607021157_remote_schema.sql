
  create policy "Authenticated users can query pool closure analysis."
  on "public"."pool_closure_analysis"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Authenticated users can query pool closures."
  on "public"."pool_updates"
  as permissive
  for select
  to authenticated
using (true);



