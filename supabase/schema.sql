


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."notification_channel" AS ENUM (
    'email',
    'sms'
);


ALTER TYPE "public"."notification_channel" OWNER TO "postgres";


CREATE TYPE "public"."notification_delivery_status" AS ENUM (
    'pending',
    'sending',
    'sent',
    'delivered',
    'failed',
    'cancelled'
);


ALTER TYPE "public"."notification_delivery_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_net_http_response"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if coalesce(new.timed_out, false)
     or new.error_msg is not null
     or new.status_code is null
     or new.status_code >= 400
  then
    raise warning 'pg_net request % failed: status=%, error=%, timed_out=%',
      new.id,
      coalesce(new.status_code::text, 'null'),
      coalesce(new.error_msg, 'none'),
      coalesce(new.timed_out, false);
  else
    raise log 'pg_net request % succeeded: status=%', new.id, new.status_code;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."log_net_http_response"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_pool_closure_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_project_url text;
  v_service_role_key text;
begin
  select decrypted_secret into v_project_url
  from vault.decrypted_secrets where name = 'project_url';

  select decrypted_secret into v_service_role_key
  from vault.decrypted_secrets where name = 'service_role_key';

  perform net.http_post(
    url := v_project_url || '/functions/v1/api/notify/email',
    body := jsonb_build_object('poolUpdateId', new.pool_update_id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_service_role_key
    )
  );

  return new;
end;
$$;


ALTER FUNCTION "public"."notify_pool_closure_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."email_deliveries" (
    "delivery_id" "uuid" NOT NULL,
    "from_address" "text" NOT NULL,
    "to_address" "text" NOT NULL,
    "reply_to" "text",
    "subject" "text",
    "bounce_type" "text",
    "complaint_type" "text",
    "last_event" "text",
    "last_event_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."email_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "idempotency_key" "uuid" NOT NULL,
    "channel" "public"."notification_channel" NOT NULL,
    "status" "public"."notification_delivery_status" DEFAULT 'pending'::"public"."notification_delivery_status" NOT NULL,
    "recipient" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "provider" "text",
    "provider_message_id" "text",
    "error" "text",
    "attempts" integer DEFAULT 0 NOT NULL,
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."notification_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pool_closure_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pool_update_id" "uuid" NOT NULL,
    "closure_date" timestamp with time zone,
    "reasoning" "text",
    "confidence_score" smallint,
    "reopening_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "flags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."pool_closure_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pool_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message" "text",
    "source" "text",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."pool_updates" OWNER TO "postgres";


ALTER TABLE ONLY "public"."email_deliveries"
    ADD CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("delivery_id");



ALTER TABLE ONLY "public"."notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_idempotency_key_user_id_key" UNIQUE ("idempotency_key", "user_id");



ALTER TABLE ONLY "public"."notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pool_closure_analysis"
    ADD CONSTRAINT "pool_closure_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pool_closure_analysis"
    ADD CONSTRAINT "pool_closure_analysis_pool_update_id_key" UNIQUE ("pool_update_id");



ALTER TABLE ONLY "public"."pool_updates"
    ADD CONSTRAINT "pool_updates_pkey" PRIMARY KEY ("id");



CREATE INDEX "notification_deliveries_pending_idx" ON "public"."notification_deliveries" USING "btree" ("created_at") WHERE ("status" = 'pending'::"public"."notification_delivery_status");



CREATE UNIQUE INDEX "notification_deliveries_provider_message_id_key" ON "public"."notification_deliveries" USING "btree" ("provider_message_id") WHERE ("provider_message_id" IS NOT NULL);



CREATE INDEX "notification_deliveries_user_id_idx" ON "public"."notification_deliveries" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."email_deliveries" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."notification_deliveries" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."pool_closure_analysis" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."pool_updates" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "notify_pool_closure_email" AFTER INSERT ON "public"."pool_closure_analysis" FOR EACH ROW EXECUTE FUNCTION "public"."notify_pool_closure_email"();



ALTER TABLE ONLY "public"."email_deliveries"
    ADD CONSTRAINT "email_deliveries_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."notification_deliveries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_deliveries"
    ADD CONSTRAINT "notification_deliveries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pool_closure_analysis"
    ADD CONSTRAINT "pool_closure_analysis_pool_update_id_fkey" FOREIGN KEY ("pool_update_id") REFERENCES "public"."pool_updates"("id");



CREATE POLICY "Authenticated users can query pool closure analysis." ON "public"."pool_closure_analysis" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can query pool closures." ON "public"."pool_updates" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."email_deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pool_closure_analysis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pool_updates" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_net_http_response"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_net_http_response"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."notify_pool_closure_email"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notify_pool_closure_email"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON TABLE "public"."email_deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."notification_deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."pool_closure_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."pool_closure_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."pool_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."pool_updates" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







