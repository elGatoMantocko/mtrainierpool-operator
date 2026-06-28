SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict eNLzuwr7spV9h0apaKgNYbek3NulnAiNEu46i24nT2ZsUtumJJhTMw1yyBzoxUq

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
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

INSERT INTO "vault"."secrets" ("id", "name", "description", "secret", "key_id", "nonce", "created_at", "updated_at") VALUES
	('702921f4-af29-4dc5-97b9-424c62c434f9', 'project_url', '', '4mbb5f/ka6DEEE6kLuH7c8QiEGBZ4ada7om7nbgmQlDbqp+xyGM16XjBe66SquDksGA3tUMHNenh
zcXHm8+LKZJx', NULL, '\xa5ee328db6770993d2f6a5bafa3b2050', '2026-05-30 23:59:23.818217+00', '2026-06-06 18:44:29.240885+00'),
	('26b02b53-010c-435d-814a-6e774202cf1a', 'service_role_key', '', 'dI2XegwKkywMXQ2csZuLpZ8PzHHVTVB0SD/uqZGgX9yK5D8u351ap+VXKItD68DSWsOXxUEWerzA
xbFHYiyBg++N3RPiJyrSAA==', NULL, '\xe10085d05da0f3b222d728583d0e493e', '2026-06-06 18:46:22.290242+00', '2026-06-06 18:46:22.290242+00');


--
-- PostgreSQL database dump complete
--

-- \unrestrict eNLzuwr7spV9h0apaKgNYbek3NulnAiNEu46i24nT2ZsUtumJJhTMw1yyBzoxUq

RESET ALL;
