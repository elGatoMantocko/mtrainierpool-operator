SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict ei2FWFHpB8veAUMFhvEDQJz0c01R8RU85EcbIqRGjblZCWnNtYKfCR1nQMzdxIo

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: notification_deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notification_deliveries" ("id", "user_id", "type", "idempotency_key", "channel", "status", "recipient", "payload", "provider", "provider_message_id", "error", "attempts", "sent_at", "delivered_at", "failed_at", "created_at", "updated_at") VALUES
	('92c690ce-7233-4d08-b595-b968f92d28aa', '154ba3e6-b1a9-49f7-a6b2-f13c69e4894e', 'pool_closure', '4d331582-ae53-4e3b-879b-2f70a8e37129', 'email', 'sent', 'emantock@gmail.com', '{"pool_update_id": "abf47ef9-efb2-5211-a9a9-c5ddc178c3fb"}', 'ses', '0101019ef66172ae-afa529c4-3efa-42ab-8f0f-925e6d181305-000000', NULL, 1, '2026-06-23 21:26:23.958441+00', NULL, NULL, '2026-06-23 21:26:23.27689+00', '2026-06-23 21:26:23.959584+00'),
	('1504cbab-cffb-4e7b-99e4-8248ed743e64', '06d6cfbf-6816-4690-8888-67c4672ccbe1', 'pool_closure', '4d331582-ae53-4e3b-879b-2f70a8e37129', 'email', 'sent', 'mycahddavis93@gmail.com', '{"pool_update_id": "abf47ef9-efb2-5211-a9a9-c5ddc178c3fb"}', 'ses', '0101019ef6617384-ee541b05-3571-4abd-91f1-da3f692f3712-000000', NULL, 1, '2026-06-23 21:26:24.159744+00', NULL, NULL, '2026-06-23 21:26:23.969142+00', '2026-06-23 21:26:24.162768+00'),
	('d9ed2f00-529d-4b15-bec5-6358010dde9f', '154ba3e6-b1a9-49f7-a6b2-f13c69e4894e', 'pool_closure', 'c265731f-2d8f-47ac-aa6f-0c859265b612', 'email', 'sent', 'emantock@gmail.com', '{"pool_update_id": "3ec916ce-df1a-5276-b8e6-e2ce4297328c"}', 'ses', '0101019efe3b0c19-8dea21e6-8c6e-4cc9-a2de-589ef62ac5a4-000000', NULL, 1, '2026-06-25 10:01:24.015276+00', NULL, NULL, '2026-06-25 10:01:23.619836+00', '2026-06-25 10:01:24.016546+00'),
	('438a167c-d74e-4d4d-b6f7-f3c0a2254afb', '06d6cfbf-6816-4690-8888-67c4672ccbe1', 'pool_closure', 'c265731f-2d8f-47ac-aa6f-0c859265b612', 'email', 'sent', 'mycahddavis93@gmail.com', '{"pool_update_id": "3ec916ce-df1a-5276-b8e6-e2ce4297328c"}', 'ses', '0101019efe3b0cd4-18a0d5d1-e8d1-4044-9e96-a9b300deebe3-000000', NULL, 1, '2026-06-25 10:01:24.200446+00', NULL, NULL, '2026-06-25 10:01:24.026826+00', '2026-06-25 10:01:24.201775+00'),
	('e1c9e80f-20df-46e0-8ce6-989c8c5f7959', '154ba3e6-b1a9-49f7-a6b2-f13c69e4894e', 'pool_closure', '39328324-66d2-41ad-8fba-c82156816847', 'email', 'sent', 'emantock@gmail.com', '{"pool_update_id": "1543174e-1751-5966-af1e-a59eb50c3058"}', 'ses', '0101019f1006db1e-897f0aa3-6e08-4fb8-bfdc-dd2a84f1d147-000000', NULL, 1, '2026-06-28 20:57:31.232012+00', NULL, NULL, '2026-06-28 20:57:30.801413+00', '2026-06-28 20:57:31.233728+00'),
	('472a7b16-40f4-48b4-87ea-0f101958f900', '06d6cfbf-6816-4690-8888-67c4672ccbe1', 'pool_closure', '39328324-66d2-41ad-8fba-c82156816847', 'email', 'sent', 'mycahddavis93@gmail.com', '{"pool_update_id": "1543174e-1751-5966-af1e-a59eb50c3058"}', 'ses', '0101019f1006dbf0-f1bd7d51-b3ed-40f3-95d8-9f1f8305ea8e-000000', NULL, 1, '2026-06-28 20:57:31.438756+00', NULL, NULL, '2026-06-28 20:57:31.252561+00', '2026-06-28 20:57:31.440118+00'),
	('5f7e07cb-509f-40fe-b10e-53e587b6b44c', '154ba3e6-b1a9-49f7-a6b2-f13c69e4894e', 'pool_closure', '47ceb0f3-906b-4f20-81ee-0562427350c7', 'email', 'sent', 'emantock@gmail.com', '{"pool_update_id": "1543174e-1751-5966-af1e-a59eb50c3058"}', 'ses', '0101019f100c865a-1562d7ae-efff-4048-8f13-62e3c73ef1a0-000000', NULL, 1, '2026-06-28 21:03:42.76195+00', NULL, NULL, '2026-06-28 21:03:42.461226+00', '2026-06-28 21:03:42.763082+00'),
	('a8080969-ea9d-44cc-b276-50ce66fe8de4', '06d6cfbf-6816-4690-8888-67c4672ccbe1', 'pool_closure', '47ceb0f3-906b-4f20-81ee-0562427350c7', 'email', 'sent', 'mycahddavis93@gmail.com', '{"pool_update_id": "1543174e-1751-5966-af1e-a59eb50c3058"}', 'ses', '0101019f100c8731-d8ff148e-386d-4211-8e68-24d91863288b-000000', NULL, 1, '2026-06-28 21:03:42.951074+00', NULL, NULL, '2026-06-28 21:03:42.772279+00', '2026-06-28 21:03:42.952439+00');


--
-- Data for Name: email_deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."email_deliveries" ("delivery_id", "from_address", "to_address", "reply_to", "subject", "bounce_type", "complaint_type", "last_event", "last_event_at", "created_at", "updated_at") VALUES
	('92c690ce-7233-4d08-b595-b968f92d28aa', 'admin@mantock.com', 'emantock@gmail.com', NULL, 'Mt. Rainier Pool — Closure Notice', NULL, NULL, NULL, NULL, '2026-06-23 21:26:23.964732+00', NULL),
	('1504cbab-cffb-4e7b-99e4-8248ed743e64', 'admin@mantock.com', 'mycahddavis93@gmail.com', NULL, 'Mt. Rainier Pool — Closure Notice', NULL, NULL, NULL, NULL, '2026-06-23 21:26:24.168455+00', NULL),
	('d9ed2f00-529d-4b15-bec5-6358010dde9f', 'admin@mantock.com', 'emantock@gmail.com', NULL, 'Mt. Rainier Pool — Closure Notice', NULL, NULL, NULL, NULL, '2026-06-25 10:01:24.021818+00', NULL),
	('438a167c-d74e-4d4d-b6f7-f3c0a2254afb', 'admin@mantock.com', 'mycahddavis93@gmail.com', NULL, 'Mt. Rainier Pool — Closure Notice', NULL, NULL, NULL, NULL, '2026-06-25 10:01:24.206999+00', NULL),
	('e1c9e80f-20df-46e0-8ce6-989c8c5f7959', 'admin@mantock.com', 'emantock@gmail.com', NULL, 'Mt. Rainier Pool — Closure Notice', NULL, NULL, NULL, NULL, '2026-06-28 20:57:31.247803+00', NULL),
	('472a7b16-40f4-48b4-87ea-0f101958f900', 'admin@mantock.com', 'mycahddavis93@gmail.com', NULL, 'Mt. Rainier Pool — Closure Notice', NULL, NULL, NULL, NULL, '2026-06-28 20:57:31.445389+00', NULL),
	('5f7e07cb-509f-40fe-b10e-53e587b6b44c', 'admin@mantock.com', 'emantock@gmail.com', NULL, 'Mt. Rainier Pool — Closure Notice', NULL, NULL, NULL, NULL, '2026-06-28 21:03:42.767793+00', NULL),
	('a8080969-ea9d-44cc-b276-50ce66fe8de4', 'admin@mantock.com', 'mycahddavis93@gmail.com', NULL, 'Mt. Rainier Pool — Closure Notice', NULL, NULL, NULL, NULL, '2026-06-28 21:03:42.957196+00', NULL);


--
-- Data for Name: pool_updates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pool_updates" ("id", "message", "source", "deleted_at", "created_at", "updated_at") VALUES
	('cfad4381-ba33-51bd-9540-38b17707f8f8', 'Pool Closed Thurdsay Due to Mechanical Issue. Friday update will be made at 6am that morning.', 'mtrainierpool.com', NULL, '2026-06-11 19:28:43.361357+00', NULL),
	('f8476646-5bca-5941-9738-26297e736272', 'Pool Closed Thurdsay Due to Mechanical Issue. POOL WIlL REOPEN FRIDAY AT 4PM.', 'mtrainierpool.com', NULL, '2026-06-11 23:30:01.140043+00', NULL),
	('e08bf289-93d4-59b7-9a86-1dda6103732f', 'POOL CLOSED THRU MONDAY, MAY 25. CURRENT SWIM LESSON REGISTRATION STARTS AT 4:30PM (5/19). See swim lesson page for more info.', 'mtrainierpool.com', NULL, '2026-05-22 05:21:56.180194+00', '2026-05-22 06:14:01.185099+00'),
	('4d1e7842-9ab7-5a47-9d72-16eda917d5ea', 'POOL CLOSED THRU MONDAY, MAY 25. Over 130 Swim Lesson Spots Available at All Ages & Levels.', 'mtrainierpool.com', NULL, '2026-05-24 20:20:38.409599+00', '2026-05-24 21:18:52.383297+00'),
	('1543174e-1751-5966-af1e-a59eb50c3058', 'Pool schedule closures: Friday, June 26 at 6:30pm, Sunday, June 28 (all-day) and late opening on Monday, June 29 at 9am.', 'mtrainierpool.com', NULL, '2026-06-28 21:03:09.876069+00', '2026-06-28 21:18:38.846127+00'),
	('3ec916ce-df1a-5276-b8e6-e2ce4297328c', 'Pool closed the morning of Wednesday, June 24. We will re-open at 4pm on Wednesday for swim lessons.', 'mtrainierpool.com', NULL, '2026-06-25 09:00:03.372828+00', '2026-06-25 12:50:03.353245+00'),
	('086cd278-a780-53ea-9fe7-2aaa02d871bf', 'Pool closed after 6pm on Tuesday, June 24 thru the morning of Wednesday, June 24. We will re-open at 4pm on Wednesday for swim lessons.', 'mtrainierpool.com', NULL, '2026-06-24 09:00:04.590769+00', '2026-06-24 15:50:04.043331+00'),
	('665d0bdc-afc9-5b4b-ae73-7a291d64c73b', 'POOL CLOSURE EXTENDED THRU TUESDAY, MAY 26. Over 130 Swim Lesson Spots Available at All Ages & Levels.', 'mtrainierpool.com', NULL, '2026-05-25 20:54:48.977164+00', '2026-05-25 22:13:28.801352+00'),
	('8020f9a7-f2e7-5d23-ab64-2afdbe15e9a7', 'POOL RE-OPENING WEDNESDAY, MAY 27 at 6:00am. We also still have plenty of spots for swim lessons starting this and next week.', 'mtrainierpool.com', NULL, '2026-05-27 06:52:02.230623+00', '2026-05-27 07:01:11.037967+00'),
	('6afb352f-bbe7-5bbc-a0b0-a39140549f7d', 'POOL IS OPEN! Also, visit our swim lesson page for remaining class openings!', 'mtrainierpool.com', NULL, '2026-05-27 17:53:26.02687+00', '2026-05-28 19:50:07.566066+00'),
	('ae81b225-e66b-57af-97d2-1c3a92ae3547', 'NEW SCHEDULE TAKES EFFECT MONDAY, JUNE 1st!', 'mtrainierpool.com', NULL, '2026-05-31 00:23:33.438303+00', '2026-06-06 18:46:52.706974+00'),
	('8f68b872-71e7-508b-bf34-0e350f1ce6a2', 'POOL REOPENED. Open regular hours.', 'mtrainierpool.com', NULL, '2026-06-09 19:21:21.826+00', NULL),
	('3e314623-9463-5f98-b80a-8ec495bad669', 'Summer Swim Lesson Information Now Available!', 'mtrainierpool.com', NULL, '2026-06-10 17:00:02.077243+00', NULL),
	('6c03f2ff-a646-56ee-b6fb-4680af3a3d6c', 'Summer Swim Lesson Info Now Available! Scholarship deadline is June 23!', 'mtrainierpool.com', NULL, '2026-06-15 20:26:14.100199+00', '2026-06-23 15:50:01.215732+00'),
	('abf47ef9-efb2-5211-a9a9-c5ddc178c3fb', 'Pool closed the morning of June 24. We will re-open at 4pm for swm lessons.', 'mtrainierpool.com', NULL, '2026-06-23 21:25:53.250565+00', NULL);


--
-- Data for Name: pool_operator_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pool_operator_analysis" ("id", "pool_update_id", "model", "created_at", "updated_at") VALUES
	('398bd4d1-70da-4a30-9d18-6e2539806c76', '665d0bdc-afc9-5b4b-ae73-7a291d64c73b', 'pool_operator', '2026-05-25 22:01:05.302224+00', '2026-05-25 22:14:01.981284+00'),
	('233553c1-7222-4e96-a307-78174fc67f50', '8020f9a7-f2e7-5d23-ab64-2afdbe15e9a7', 'pool_operator', '2026-05-27 07:01:38.854895+00', NULL),
	('dff55949-bb5b-4df0-a5dd-ab45a9b99f00', '6afb352f-bbe7-5bbc-a0b0-a39140549f7d', 'pool_operator', '2026-05-27 17:53:41.978317+00', '2026-05-28 19:50:23.488135+00'),
	('e0e39212-ab9a-400b-858f-0a550037714a', 'ae81b225-e66b-57af-97d2-1c3a92ae3547', 'pool_operator', '2026-05-31 00:25:02.576407+00', '2026-06-06 18:47:41.034935+00'),
	('0ccdf751-ce3e-46e6-aae0-572120a3eec9', '8f68b872-71e7-508b-bf34-0e350f1ce6a2', 'pool_operator', '2026-06-09 19:22:09.278252+00', NULL),
	('4be10256-c19b-4145-9a97-fae6ef1fd3e0', '3e314623-9463-5f98-b80a-8ec495bad669', 'pool_operator', '2026-06-10 17:00:31.648563+00', NULL),
	('65615dd9-8f51-4623-8548-db1add5da0a2', 'cfad4381-ba33-51bd-9540-38b17707f8f8', 'pool_operator', '2026-06-11 19:29:31.646529+00', NULL),
	('7155748d-48a6-4931-a8f0-0c25316fbe8b', 'f8476646-5bca-5941-9738-26297e736272', 'pool_operator', '2026-06-11 23:30:55.717171+00', NULL),
	('979cb3c4-2671-40d3-b4b8-d242a659e8fc', '6c03f2ff-a646-56ee-b6fb-4680af3a3d6c', 'pool_operator', '2026-06-15 20:27:04.00251+00', NULL),
	('09bf6d57-3e1c-4f47-9a2f-972bc5662852', 'abf47ef9-efb2-5211-a9a9-c5ddc178c3fb', 'pool_operator', '2026-06-23 21:26:23.238768+00', NULL),
	('c74a2ef6-a3df-4ebf-b1b6-c0b7100c33e9', '086cd278-a780-53ea-9fe7-2aaa02d871bf', 'pool_operator', '2026-06-24 09:21:32.307649+00', NULL),
	('8102249d-9f22-42f3-bbd0-476f1ec4e67a', '3ec916ce-df1a-5276-b8e6-e2ce4297328c', 'pool_operator', '2026-06-25 10:01:23.580798+00', NULL),
	('47ceb0f3-906b-4f20-81ee-0562427350c7', '1543174e-1751-5966-af1e-a59eb50c3058', 'pool-operator', '2026-06-28 21:03:42.428834+00', NULL);


--
-- Data for Name: pool_closures; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pool_closures" ("id", "analysis_id", "closed_at", "opened_at", "confidence_score", "reasoning", "flags", "created_at", "updated_at") VALUES
	('bf2e5c41-a346-46fd-932d-c4e6cd9959d4', '398bd4d1-70da-4a30-9d18-6e2539806c76', '2026-05-26 07:00:00+00', NULL, 90, 'The update explicitly states a closure is extended through Tuesday, May 26 (2026). The reopening date is not specified, implying it is TBD. Confidence is high on the closure date, but the mention of available swim lessons introduces ambiguity regarding whether the pool is fully closed to the general public or operating for specific programs.', '{status_ambiguous}', '2026-05-25 22:01:05.302224+00', '2026-05-25 22:14:01.981284+00'),
	('8a8e1a79-3de6-494c-a76e-3d07c118983a', '233553c1-7222-4e96-a307-78174fc67f50', NULL, '2026-05-27 07:00:00+00', 95, 'Pool owner explicitly states reopening date of May 27, 2026. Swim lessons information is secondary to pool operational status.', '{}', '2026-05-27 07:01:38.854895+00', NULL),
	('5f183b34-4750-4750-8abd-2d1629d60ea0', '65615dd9-8f51-4623-8548-db1add5da0a2', '2026-06-11 07:00:00+00', NULL, 85, 'The message states ''Pool Closed Thurdsay'' which corresponds to today''s date (Thursday) despite the spelling error. The closure is confirmed for this day due to mechanical issues. Re-opening date is not explicitly defined yet as it depends on Friday morning update verification.', '{}', '2026-06-11 19:29:31.646529+00', NULL),
	('2309cabc-70e8-4b55-ae77-0442dec6d30d', '7155748d-48a6-4931-a8f0-0c25316fbe8b', '2026-06-11 07:00:00+00', '2026-06-12 07:00:00+00', 95, 'Current date (Thursday) matches ''Closed Thurdsday'' typo resolution; reopening aligns with next Friday after current date. Typos present but meaning is unambiguous.', '{}', '2026-06-11 23:30:55.717171+00', NULL),
	('63b65e69-8e14-47f4-acf7-9c988f793601', '09bf6d57-3e1c-4f47-9a2f-972bc5662852', '2026-06-24 07:00:00+00', '2026-06-24 07:00:00+00', 95, 'Update explicitly states closure occurred in the morning of June 24 and reopening at 4pm for lessons on that same day. Dates correspond to current year context.', '{}', '2026-06-23 21:26:23.238768+00', NULL),
	('cd4a86bb-b73b-4934-8f67-e874c869aeea', 'c74a2ef6-a3df-4ebf-b1b6-c0b7100c33e9', NULL, '2026-06-24 07:00:00+00', 75, 'Pool updates indicate reopening today at 4pm on Wednesday (June 24), resolving to Today''s ISO date. The text claims closure from Tuesday June 24 through morning of Wed June 24; since Today is already Wednesday per context header, this implies a partial-day closure status ending later today rather than a standard full-date closure event. The internal contradiction regarding ''Tuesday'' and ''Wednesday'' both being ''June 24'' indicates source confusion requiring clarification on actual start date.', '{date_unclear}', '2026-06-24 09:21:32.307649+00', NULL),
	('d7f4aaaa-91da-42b9-84a3-be746341bb60', '8102249d-9f22-42f3-bbd0-476f1ec4e67a', '2026-06-24 07:00:00+00', NULL, 90, 'Closure date is explicitly stated as Wednesday, June 24 (resolved to YYYY-MM-DD format based on current year/month). Re-opening mentions ''Wednesday'' without a specific day number or month anchor relative to the future tense of ''will re-open'', creating ambiguity regarding whether this refers to an immediate same-day reopening event that has passed since today is Thursday or a recurring schedule for subsequent Wednesdays (next occurrence would be July 1, but pattern not confirmed).', '{date_unclear}', '2026-06-25 10:01:23.580798+00', NULL),
	('43937f4f-2a39-4908-9fdd-91223c5df34e', '47ceb0f3-906b-4f20-81ee-0562427350c7', '2026-06-27 01:30:00+00', NULL, 95, 'The update explicitly states a closure on Friday, June 26 at 6:30pm.', '{}', '2026-06-28 21:03:42.428834+00', NULL),
	('e4402684-7ba4-4b35-a693-ab8a42d85b63', '47ceb0f3-906b-4f20-81ee-0562427350c7', '2026-06-28 07:00:00+00', NULL, 95, 'The update specifies an all-day closure for Sunday, June 28. Time is assumed at start of day.', '{time_assumed}', '2026-06-28 21:03:42.428834+00', NULL),
	('049a3ba8-2968-464d-834e-85b38796608f', '47ceb0f3-906b-4f20-81ee-0562427350c7', NULL, '2026-06-29 16:00:00+00', 95, 'The update specifies a late opening on Monday, June 29 at 9am.', '{}', '2026-06-28 21:03:42.428834+00', NULL);


--
-- PostgreSQL database dump complete
--

-- \unrestrict ei2FWFHpB8veAUMFhvEDQJz0c01R8RU85EcbIqRGjblZCWnNtYKfCR1nQMzdxIo

RESET ALL;
