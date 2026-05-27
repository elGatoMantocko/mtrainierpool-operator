SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict fluLGkq9dpL2qhKvaMWcxTeerXqrGXvHe40OslAXW6Q2lcc30uht3rb9iYqu10Z

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
-- Data for Name: pool_closures; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pool_closures" ("id", "message", "source", "deleted_at", "created_at", "updated_at") VALUES
	('e08bf289-93d4-59b7-9a86-1dda6103732f', 'POOL CLOSED THRU MONDAY, MAY 25. CURRENT SWIM LESSON REGISTRATION STARTS AT 4:30PM (5/19). See swim lesson page for more info.', 'mtrainierpool.com', NULL, '2026-05-22 05:21:56.180194+00', '2026-05-22 06:14:01.185099+00'),
	('4d1e7842-9ab7-5a47-9d72-16eda917d5ea', 'POOL CLOSED THRU MONDAY, MAY 25. Over 130 Swim Lesson Spots Available at All Ages & Levels.', 'mtrainierpool.com', NULL, '2026-05-24 20:20:38.409599+00', '2026-05-24 21:18:52.383297+00'),
	('665d0bdc-afc9-5b4b-ae73-7a291d64c73b', 'POOL CLOSURE EXTENDED THRU TUESDAY, MAY 26. Over 130 Swim Lesson Spots Available at All Ages & Levels.', 'mtrainierpool.com', NULL, '2026-05-25 20:54:48.977164+00', '2026-05-25 22:13:28.801352+00'),
	('8020f9a7-f2e7-5d23-ab64-2afdbe15e9a7', 'POOL RE-OPENING WEDNESDAY, MAY 27 at 6:00am. We also still have plenty of spots for swim lessons starting this and next week.', 'mtrainierpool.com', NULL, '2026-05-27 06:52:02.230623+00', '2026-05-27 07:01:11.037967+00'),
	('6afb352f-bbe7-5bbc-a0b0-a39140549f7d', 'POOL IS OPEN! Also, visit our swim lesson page for remaining class openings!', 'mtrainierpool.com', NULL, '2026-05-27 17:53:26.02687+00', NULL);


--
-- Data for Name: pool_closure_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pool_closure_analysis" ("id", "pool_closure_id", "closure_date", "reasoning", "confidence_score", "reopening_date", "created_at", "flags", "updated_at") VALUES
	('e7f49d28-6689-4602-a34a-c8d9c02369e8', '665d0bdc-afc9-5b4b-ae73-7a291d64c73b', '2026-05-26', 'The update explicitly states a closure is extended through Tuesday, May 26 (2026). The reopening date is not specified, implying it is TBD. Confidence is high on the closure date, but the mention of available swim lessons introduces ambiguity regarding whether the pool is fully closed to the general public or operating for specific programs.', 90, NULL, '2026-05-25 22:01:05.302224+00', '{status_ambiguous}', '2026-05-25 22:14:01.981284+00'),
	('1ec0aec3-ed83-408c-ad73-3b3baaba7c2e', '8020f9a7-f2e7-5d23-ab64-2afdbe15e9a7', NULL, 'Pool owner explicitly states reopening date of May 27, 2026. Swim lessons information is secondary to pool operational status.', 95, '2026-05-27', '2026-05-27 07:01:38.854895+00', '{}', NULL),
	('6fd7d1d6-81ce-4d2b-a3d1-1ef1e00d886f', '6afb352f-bbe7-5bbc-a0b0-a39140549f7d', NULL, 'Update explicitly states ''POOL IS OPEN'', indicating current operational status. No specific closure or reopening dates are mentioned.', 100, NULL, '2026-05-27 17:53:41.978317+00', '{}', NULL);


--
-- PostgreSQL database dump complete
--

-- \unrestrict fluLGkq9dpL2qhKvaMWcxTeerXqrGXvHe40OslAXW6Q2lcc30uht3rb9iYqu10Z

RESET ALL;
