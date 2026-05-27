create extension if not exists "moddatetime" with schema "extensions";


  create table "public"."pool_closure_analysis" (
    "id" uuid not null default gen_random_uuid(),
    "pool_closure_id" uuid not null,
    "closure_date" date,
    "reasoning" text,
    "confidence_score" smallint,
    "reopening_date" date,
    "created_at" timestamp with time zone not null default now(),
    "flags" text[] not null default '{}'::text[],
    "updated_at" timestamp with time zone
      );


alter table "public"."pool_closure_analysis" enable row level security;

CREATE UNIQUE INDEX pool_closure_analysis_pkey ON public.pool_closure_analysis USING btree (id);

CREATE UNIQUE INDEX pool_closure_analysis_pool_closure_id_key ON public.pool_closure_analysis USING btree (pool_closure_id);

alter table "public"."pool_closure_analysis" add constraint "pool_closure_analysis_pkey" PRIMARY KEY using index "pool_closure_analysis_pkey";

alter table "public"."pool_closure_analysis" add constraint "pool_closure_analysis_pool_closure_id_fkey" FOREIGN KEY (pool_closure_id) REFERENCES public.pool_closures(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."pool_closure_analysis" validate constraint "pool_closure_analysis_pool_closure_id_fkey";

alter table "public"."pool_closure_analysis" add constraint "pool_closure_analysis_pool_closure_id_key" UNIQUE using index "pool_closure_analysis_pool_closure_id_key";

grant delete on table "public"."pool_closure_analysis" to "anon";

grant insert on table "public"."pool_closure_analysis" to "anon";

grant references on table "public"."pool_closure_analysis" to "anon";

grant select on table "public"."pool_closure_analysis" to "anon";

grant trigger on table "public"."pool_closure_analysis" to "anon";

grant truncate on table "public"."pool_closure_analysis" to "anon";

grant update on table "public"."pool_closure_analysis" to "anon";

grant delete on table "public"."pool_closure_analysis" to "authenticated";

grant insert on table "public"."pool_closure_analysis" to "authenticated";

grant references on table "public"."pool_closure_analysis" to "authenticated";

grant select on table "public"."pool_closure_analysis" to "authenticated";

grant trigger on table "public"."pool_closure_analysis" to "authenticated";

grant truncate on table "public"."pool_closure_analysis" to "authenticated";

grant update on table "public"."pool_closure_analysis" to "authenticated";

grant delete on table "public"."pool_closure_analysis" to "service_role";

grant insert on table "public"."pool_closure_analysis" to "service_role";

grant references on table "public"."pool_closure_analysis" to "service_role";

grant select on table "public"."pool_closure_analysis" to "service_role";

grant trigger on table "public"."pool_closure_analysis" to "service_role";

grant truncate on table "public"."pool_closure_analysis" to "service_role";

grant update on table "public"."pool_closure_analysis" to "service_role";

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.pool_closure_analysis FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.pool_closures FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');


