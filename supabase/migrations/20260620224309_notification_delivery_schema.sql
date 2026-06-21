create type "public"."notification_channel" as enum ('email', 'sms');

create type "public"."notification_delivery_status" as enum ('pending', 'sending', 'sent', 'delivered', 'failed', 'cancelled');


  create table "public"."email_deliveries" (
    "delivery_id" uuid not null,
    "from_address" text not null,
    "to_address" text not null,
    "reply_to" text,
    "subject" text,
    "bounce_type" text,
    "complaint_type" text,
    "last_event" text,
    "last_event_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone
      );


alter table "public"."email_deliveries" enable row level security;


  create table "public"."notification_deliveries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "type" text not null,
    "idempotency_key" uuid not null,
    "channel" public.notification_channel not null,
    "status" public.notification_delivery_status not null default 'pending'::public.notification_delivery_status,
    "recipient" text not null,
    "payload" jsonb not null default '{}'::jsonb,
    "provider" text,
    "provider_message_id" text,
    "error" text,
    "attempts" integer not null default 0,
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone
      );


alter table "public"."notification_deliveries" enable row level security;

CREATE UNIQUE INDEX email_deliveries_pkey ON public.email_deliveries USING btree (delivery_id);

CREATE UNIQUE INDEX notification_deliveries_idempotency_key_user_id_key ON public.notification_deliveries USING btree (idempotency_key, user_id);

CREATE INDEX notification_deliveries_pending_idx ON public.notification_deliveries USING btree (created_at) WHERE (status = 'pending'::public.notification_delivery_status);

CREATE UNIQUE INDEX notification_deliveries_pkey ON public.notification_deliveries USING btree (id);

CREATE UNIQUE INDEX notification_deliveries_provider_message_id_key ON public.notification_deliveries USING btree (provider_message_id) WHERE (provider_message_id IS NOT NULL);

CREATE INDEX notification_deliveries_user_id_idx ON public.notification_deliveries USING btree (user_id);

alter table "public"."email_deliveries" add constraint "email_deliveries_pkey" PRIMARY KEY using index "email_deliveries_pkey";

alter table "public"."notification_deliveries" add constraint "notification_deliveries_pkey" PRIMARY KEY using index "notification_deliveries_pkey";

alter table "public"."email_deliveries" add constraint "email_deliveries_delivery_id_fkey" FOREIGN KEY (delivery_id) REFERENCES public.notification_deliveries(id) ON DELETE CASCADE not valid;

alter table "public"."email_deliveries" validate constraint "email_deliveries_delivery_id_fkey";

alter table "public"."notification_deliveries" add constraint "notification_deliveries_idempotency_key_user_id_key" UNIQUE using index "notification_deliveries_idempotency_key_user_id_key";

alter table "public"."notification_deliveries" add constraint "notification_deliveries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notification_deliveries" validate constraint "notification_deliveries_user_id_fkey";

grant delete on table "public"."email_deliveries" to "anon";

grant insert on table "public"."email_deliveries" to "anon";

grant references on table "public"."email_deliveries" to "anon";

grant select on table "public"."email_deliveries" to "anon";

grant trigger on table "public"."email_deliveries" to "anon";

grant truncate on table "public"."email_deliveries" to "anon";

grant update on table "public"."email_deliveries" to "anon";

grant delete on table "public"."email_deliveries" to "authenticated";

grant insert on table "public"."email_deliveries" to "authenticated";

grant references on table "public"."email_deliveries" to "authenticated";

grant select on table "public"."email_deliveries" to "authenticated";

grant trigger on table "public"."email_deliveries" to "authenticated";

grant truncate on table "public"."email_deliveries" to "authenticated";

grant update on table "public"."email_deliveries" to "authenticated";

grant delete on table "public"."email_deliveries" to "service_role";

grant insert on table "public"."email_deliveries" to "service_role";

grant references on table "public"."email_deliveries" to "service_role";

grant select on table "public"."email_deliveries" to "service_role";

grant trigger on table "public"."email_deliveries" to "service_role";

grant truncate on table "public"."email_deliveries" to "service_role";

grant update on table "public"."email_deliveries" to "service_role";

grant delete on table "public"."notification_deliveries" to "anon";

grant insert on table "public"."notification_deliveries" to "anon";

grant references on table "public"."notification_deliveries" to "anon";

grant select on table "public"."notification_deliveries" to "anon";

grant trigger on table "public"."notification_deliveries" to "anon";

grant truncate on table "public"."notification_deliveries" to "anon";

grant update on table "public"."notification_deliveries" to "anon";

grant delete on table "public"."notification_deliveries" to "authenticated";

grant insert on table "public"."notification_deliveries" to "authenticated";

grant references on table "public"."notification_deliveries" to "authenticated";

grant select on table "public"."notification_deliveries" to "authenticated";

grant trigger on table "public"."notification_deliveries" to "authenticated";

grant truncate on table "public"."notification_deliveries" to "authenticated";

grant update on table "public"."notification_deliveries" to "authenticated";

grant delete on table "public"."notification_deliveries" to "service_role";

grant insert on table "public"."notification_deliveries" to "service_role";

grant references on table "public"."notification_deliveries" to "service_role";

grant select on table "public"."notification_deliveries" to "service_role";

grant trigger on table "public"."notification_deliveries" to "service_role";

grant truncate on table "public"."notification_deliveries" to "service_role";

grant update on table "public"."notification_deliveries" to "service_role";

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.email_deliveries FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notification_deliveries FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');


