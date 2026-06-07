ALTER TABLE public.pool_closures RENAME TO pool_updates;
ALTER INDEX pool_closures_pkey RENAME TO pool_updates_pkey;

ALTER TABLE public.pool_closure_analysis
  DROP CONSTRAINT pool_closure_analysis_pool_closure_id_fkey;

ALTER TABLE public.pool_closure_analysis
  RENAME COLUMN pool_closure_id TO pool_update_id;

ALTER TABLE public.pool_closure_analysis
  ADD CONSTRAINT pool_closure_analysis_pool_update_id_fkey
    FOREIGN KEY (pool_update_id) REFERENCES public.pool_updates(id);

ALTER TABLE public.pool_closure_analysis
  RENAME CONSTRAINT pool_closure_analysis_pool_closure_id_key TO pool_closure_analysis_pool_update_id_key;
