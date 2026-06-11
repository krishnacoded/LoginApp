--
-- PostgreSQL database dump
--

\restrict ewO7znktAKWDadGSexglzH6CitNjECqBwUFuj2Dy8SPbreleGBtSLjOUV1Q2cWO

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._migrations (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    executed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public._migrations OWNER TO postgres;

--
-- Name: _migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._migrations_id_seq OWNER TO postgres;

--
-- Name: _migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._migrations_id_seq OWNED BY public._migrations.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    employee_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(100),
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20) NOT NULL,
    description text,
    head_employee_id uuid,
    parent_department_id uuid,
    budget numeric(15,2),
    location character varying(200),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid,
    uploaded_by uuid,
    document_type character varying(50) NOT NULL,
    document_name character varying(255) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    is_verified boolean DEFAULT false,
    verified_by uuid,
    verified_at timestamp with time zone,
    expiry_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_verification_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.email_verification_tokens OWNER TO postgres;

--
-- Name: employee_skills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_skills (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    skill_id uuid NOT NULL,
    proficiency_level integer,
    years_experience numeric(4,1),
    is_primary boolean DEFAULT false,
    certified boolean DEFAULT false,
    certification_url character varying(500),
    acquired_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT employee_skills_proficiency_level_check CHECK (((proficiency_level >= 1) AND (proficiency_level <= 5)))
);


ALTER TABLE public.employee_skills OWNER TO postgres;

--
-- Name: employee_timeline; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_timeline (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    event_date date NOT NULL,
    performed_by uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.employee_timeline OWNER TO postgres;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    employee_code character varying(20) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    date_of_birth date,
    gender character varying(20),
    phone character varying(20),
    personal_email character varying(255),
    address jsonb DEFAULT '{}'::jsonb,
    emergency_contact jsonb DEFAULT '{}'::jsonb,
    department_id uuid,
    designation character varying(100),
    employment_type character varying(50) DEFAULT 'full_time'::character varying,
    employment_status character varying(50) DEFAULT 'active'::character varying,
    joining_date date,
    confirmation_date date,
    resignation_date date,
    last_working_date date,
    manager_id uuid,
    salary numeric(12,2),
    bank_details jsonb DEFAULT '{}'::jsonb,
    profile_picture_url character varying(500),
    bio text,
    linkedin_url character varying(300),
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: leave_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_approvals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    leave_request_id uuid NOT NULL,
    approver_id uuid NOT NULL,
    approver_role character varying(50) NOT NULL,
    stage integer NOT NULL,
    action character varying(30) NOT NULL,
    comment text,
    actioned_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.leave_approvals OWNER TO postgres;

--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_balances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    leave_type_id uuid NOT NULL,
    year integer NOT NULL,
    allocated_days numeric(5,1) DEFAULT 0,
    used_days numeric(5,1) DEFAULT 0,
    pending_days numeric(5,1) DEFAULT 0,
    carried_forward_days numeric(5,1) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.leave_balances OWNER TO postgres;

--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    leave_type_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days numeric(5,1) NOT NULL,
    reason text NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying,
    attachment_url character varying(500),
    is_half_day boolean DEFAULT false,
    half_day_type character varying(10),
    applied_at timestamp with time zone DEFAULT now(),
    cancelled_at timestamp with time zone,
    cancelled_by uuid,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.leave_requests OWNER TO postgres;

--
-- Name: leave_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#4F46E5'::character varying,
    max_days_per_year integer DEFAULT 0,
    max_consecutive_days integer,
    carry_forward boolean DEFAULT false,
    max_carry_forward_days integer DEFAULT 0,
    requires_attachment boolean DEFAULT false,
    requires_approval boolean DEFAULT true,
    applicable_gender character varying(20),
    min_service_months integer DEFAULT 0,
    is_paid boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.leave_types OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    action_url character varying(500),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_revoked boolean DEFAULT false,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    permissions jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: skill_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#4F46E5'::character varying,
    icon character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.skill_categories OWNER TO postgres;

--
-- Name: skills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skills (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    category_id uuid,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.skills OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role_id integer,
    is_active boolean DEFAULT true,
    is_email_verified boolean DEFAULT false,
    last_login timestamp with time zone,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: _migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._migrations ALTER COLUMN id SET DEFAULT nextval('public._migrations_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Data for Name: _migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._migrations (id, filename, executed_at) FROM stdin;
1	001_schema.sql	2026-06-10 16:43:38.12141+05:30
2	002_seed.sql	2026-06-10 16:43:38.330226+05:30
3	003_email_verification_and_demo_dataset.sql	2026-06-11 03:18:19.600725+05:30
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, employee_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
4e6050c4-4c91-4585-8d0d-29141a258565	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	REGISTER	auth	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	{"email": "krsnaa134@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 18:35:25.434457+05:30
f9e0ef33-8dc8-4d72-9bf9-13a425cd1efa	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	LOGIN	auth	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	{"email": "krsnaa134@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 18:41:40.396195+05:30
0c18c69e-6371-46d1-8151-9704e035ddfb	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	LOGOUT	auth	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 18:44:01.938475+05:30
3b1f7902-654b-4081-837f-3baea57bef6a	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	LOGIN	auth	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	{"email": "krsnaa134@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 18:44:50.148197+05:30
22375c18-c503-4f48-93e1-ee88c9c62208	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	CREATE_SKILL	skill	9af1958e-9804-4f7c-8efa-d069e6e87d61	\N	{"id": "9af1958e-9804-4f7c-8efa-d069e6e87d61", "name": "Redis", "is_active": true, "created_at": "2026-06-10T14:21:00.504Z", "updated_at": "2026-06-10T14:21:00.504Z", "category_id": "11111111-1111-1111-1111-111111111004", "description": "Backend Caching"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 19:51:00.526638+05:30
9ff4f15c-efd6-450c-be93-20a2febbc0b6	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	LOGOUT	auth	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 19:53:11.853452+05:30
de2901aa-07ab-4e7e-a864-809b3dba20c3	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	LOGIN	auth	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	{"email": "krsnaa134@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 19:53:33.163141+05:30
3c246fc4-df9d-4473-9f81-ac50e4b8de71	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	LOGIN	auth	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	{"email": "krsnaa134@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:01:02.381481+05:30
c2cc5831-417b-445e-9507-8acdf62aa30e	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	LOGOUT	auth	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:02:05.836652+05:30
3fd068d6-9607-4d1d-9abb-875b5124f8a8	ec77b8f8-3848-4b3e-ab61-e733a21c432c	\N	REGISTER	auth	ec77b8f8-3848-4b3e-ab61-e733a21c432c	\N	{"email": "johnthedon@wwe.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:03:04.833887+05:30
77ca486c-f3d5-4f81-8ab9-22d847361006	ec77b8f8-3848-4b3e-ab61-e733a21c432c	\N	LOGIN	auth	ec77b8f8-3848-4b3e-ab61-e733a21c432c	\N	{"email": "johnthedon@wwe.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:03:23.763489+05:30
f3ea15e6-2142-483a-8f3d-85f71efbb93d	ec77b8f8-3848-4b3e-ab61-e733a21c432c	\N	APPLY_LEAVE	leave	b39e4c96-3232-4e5d-9ac5-cffa0b3c5182	\N	{"id": "b39e4c96-3232-4e5d-9ac5-cffa0b3c5182", "reason": "suffering from success", "status": "pending", "end_date": "2026-06-12T18:30:00.000Z", "applied_at": "2026-06-10T14:36:01.177Z", "created_at": "2026-06-10T14:36:01.177Z", "start_date": "2026-06-09T18:30:00.000Z", "total_days": "3.0", "updated_at": "2026-06-10T14:36:01.177Z", "employee_id": "f86516e6-a1b5-4ffb-b46e-f6c5c7154cd4", "is_half_day": false, "cancelled_at": null, "cancelled_by": null, "half_day_type": null, "leave_type_id": "9804a195-ac58-48e2-8246-0d03e64586c4", "attachment_url": null, "cancellation_reason": null}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:06:01.439019+05:30
cbc0a5ce-663d-4beb-975a-9b6928beae23	ec77b8f8-3848-4b3e-ab61-e733a21c432c	\N	CANCEL_LEAVE	leave	b39e4c96-3232-4e5d-9ac5-cffa0b3c5182	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:06:18.011528+05:30
9ad77763-a03a-4fe2-bf56-51b9d71d0182	ec77b8f8-3848-4b3e-ab61-e733a21c432c	\N	APPLY_LEAVE	leave	4ac4d9b7-0082-4f37-9039-70805de4abd4	\N	{"id": "4ac4d9b7-0082-4f37-9039-70805de4abd4", "reason": "asfkjsdlvpnsa", "status": "pending", "end_date": "2026-06-15T18:30:00.000Z", "applied_at": "2026-06-10T14:59:27.046Z", "created_at": "2026-06-10T14:59:27.046Z", "start_date": "2026-06-12T18:30:00.000Z", "total_days": "2.0", "updated_at": "2026-06-10T14:59:27.046Z", "employee_id": "f86516e6-a1b5-4ffb-b46e-f6c5c7154cd4", "is_half_day": false, "cancelled_at": null, "cancelled_by": null, "half_day_type": null, "leave_type_id": "1918f399-69ab-4ab7-8d9a-a22aa8e5e87f", "attachment_url": null, "cancellation_reason": null}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:29:27.66254+05:30
b5f088c1-5951-449f-bd97-a5eae19ca511	ec77b8f8-3848-4b3e-ab61-e733a21c432c	\N	LOGOUT	auth	ec77b8f8-3848-4b3e-ab61-e733a21c432c	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:29:40.695311+05:30
3004b022-2d9c-4ea3-8b36-e9e79e322ed8	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	LOGIN	auth	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	{"email": "krsnaa134@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:30:04.732745+05:30
be1afef7-287a-4102-ada5-5125bccd41f6	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	APPROVE_LEAVE	leave	4ac4d9b7-0082-4f37-9039-70805de4abd4	{"status": "pending"}	{"status": "approved"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:30:26.52767+05:30
bac1cc04-5e31-4ea4-b5f8-508f3b3650e3	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	LOGIN	auth	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	{"email": "krsnaa134@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 22:22:42.194586+05:30
8e280780-496b-4d65-864a-dce07a39156d	c1b54692-fb97-46b0-a467-c9f3ca098c22	\N	APPROVE_LEAVE	leave	88888888-8888-8888-8888-888888888002	{"status": "pending"}	{"status": "approved"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 03:22:11.437797+05:30
c0b96020-bba2-4e3a-baa3-b7f4c43a3078	972853fe-2973-4500-a589-a92e1b1c5f84	\N	REGISTER	auth	972853fe-2973-4500-a589-a92e1b1c5f84	\N	{"email": "kishankantt2007@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 03:30:39.236677+05:30
b9465491-bf2a-4609-b32b-5eb7a46bc45f	972853fe-2973-4500-a589-a92e1b1c5f84	\N	LOGIN	auth	972853fe-2973-4500-a589-a92e1b1c5f84	\N	{"email": "kishankantt2007@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 03:43:47.990681+05:30
b86c7d11-7d83-41bf-b2ed-34ab83da92da	972853fe-2973-4500-a589-a92e1b1c5f84	\N	LOGOUT	auth	972853fe-2973-4500-a589-a92e1b1c5f84	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 03:46:42.408794+05:30
1d2b992c-e436-47d0-8ac1-b539a2ffaf66	dd3c88e8-40e4-4231-9170-a5c867e783e3	\N	REGISTER	auth	dd3c88e8-40e4-4231-9170-a5c867e783e3	\N	{"email": "krsnaa135@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 04:25:51.988338+05:30
f2d15cab-55b3-4769-a072-f805a3f01490	63ac5f49-c951-4493-a1d2-a181f761ff80	\N	REGISTER	auth	63ac5f49-c951-4493-a1d2-a181f761ff80	\N	{"email": "atikshmmishra@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 12:24:58.368787+05:30
021bd434-f12c-4d14-8571-184f051e774b	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	REGISTER	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 12:38:03.402159+05:30
70bb2e46-7f27-4b21-8dc1-90a2761b2437	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 12:38:35.486125+05:30
5c3861a2-1b50-407f-a4ed-b35a2712209d	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGOUT	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 12:39:08.578504+05:30
2a93daf3-c049-4818-a22e-b20c3816470a	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 12:47:04.838968+05:30
84fa8661-cf9f-4e54-adbe-1e2394c4c34f	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 13:28:33.875741+05:30
e568b47f-6f44-475a-8a8b-e27bbd9ff90f	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGOUT	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 14:05:41.926171+05:30
002f1de4-ec30-4367-a4b9-85ee77e1a7bb	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 14:06:58.131888+05:30
567a4efb-22ea-465b-8887-04fac2525094	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGOUT	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 14:15:56.3342+05:30
f98b8f6b-3632-4447-8364-365499ddda88	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 14:16:20.107048+05:30
58d7d7c8-a180-45ef-afd7-e0c8f78793d1	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	CREATE_SKILL	skill	9c4302ca-7ab6-4247-8db1-4953c3d1fd3d	\N	{"id": "9c4302ca-7ab6-4247-8db1-4953c3d1fd3d", "name": "Man Management", "is_active": true, "created_at": "2026-06-11T08:51:52.766Z", "updated_at": "2026-06-11T08:51:52.766Z", "category_id": "11111111-1111-1111-1111-111111111002", "description": null}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 14:21:52.818037+05:30
32553d7c-aeae-4ee9-b6df-790f15f00f9e	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 14:37:37.27084+05:30
c3244421-19fe-42c9-856a-35ab2692c2d9	66666666-6666-6666-6666-666666666001	\N	LOGIN	auth	66666666-6666-6666-6666-666666666001	\N	{"email": "pranay@isoftzone.com"}	::1	\N	2026-06-11 14:43:19.658223+05:30
1f0dfe03-c37d-4449-ba32-323e57bc3b7a	66666666-6666-6666-6666-666666666001	\N	LOGIN	auth	66666666-6666-6666-6666-666666666001	\N	{"email": "pranay@isoftzone.com"}	::1	\N	2026-06-11 14:45:08.047058+05:30
d15b462c-a998-4b58-b0f7-6f67b681a92b	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	CREATE_EMPLOYEE	employee	de751bd0-7050-436f-b5ac-253242ceaf20	\N	{"id": "de751bd0-7050-436f-b5ac-253242ceaf20", "bio": null, "phone": "+1 945249532450", "gender": "male", "salary": "750000.00", "address": {}, "user_id": null, "is_active": true, "last_name": "Roy", "created_at": "2026-06-11T09:21:07.036Z", "created_by": "992a2f21-88a5-46ab-ac8f-1517251ff6f5", "deleted_at": null, "first_name": "Jason", "manager_id": "8927edf5-b7ea-4559-b809-64d9dabf8224", "updated_at": "2026-06-11T09:21:07.036Z", "designation": "Cloud Engineer", "bank_details": {}, "joining_date": "2026-01-09T18:30:00.000Z", "linkedin_url": null, "date_of_birth": "1992-01-11T18:30:00.000Z", "department_id": "22222222-2222-2222-2222-222222222001", "employee_code": "EMP0022", "personal_email": "jasonroy@email.com", "employment_type": "contract", "resignation_date": null, "confirmation_date": null, "emergency_contact": {}, "employment_status": "inactive", "last_working_date": null, "profile_picture_url": null}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 14:51:07.89585+05:30
bc7248ce-39b4-402d-8555-b41f65324a35	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 15:34:48.413583+05:30
2d631a08-c64d-4ea3-8454-5069ed17789c	66666666-6666-6666-6666-666666666001	\N	LOGIN	auth	66666666-6666-6666-6666-666666666001	\N	{"email": "pranay@isoftzone.com"}	::1	\N	2026-06-11 15:39:17.328341+05:30
db6a0ea6-b844-4adf-beb9-cc81bc657e34	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 15:51:19.993947+05:30
737b098f-09bf-4805-9f0a-9a1fd0615ff1	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	UPDATE_EMPLOYEE	employee	de751bd0-7050-436f-b5ac-253242ceaf20	{"id": "de751bd0-7050-436f-b5ac-253242ceaf20", "bio": null, "email": null, "phone": "+1 945249532450", "gender": "male", "salary": "750000.00", "skills": [{"id": "04293d3b-c3bd-4742-8283-a7d450265c1c", "skill_id": "272634b1-41ea-4b4d-9416-f4ac92b97436", "certified": false, "is_primary": false, "skill_name": "Agile/Scrum", "category_name": "Management", "category_color": "#0047AB", "years_experience": "0.0", "proficiency_level": 3}, {"id": "a58deb56-ab72-48a9-894c-56e41677fdbc", "skill_id": "a33babe3-5fee-4c2a-a2d5-c6511e5f151b", "certified": false, "is_primary": false, "skill_name": "DevOps", "category_name": "Technical", "category_color": "#4F46E5", "years_experience": "0.0", "proficiency_level": 3}, {"id": "897bb371-1d4a-46ba-8a8a-8c3e69193328", "skill_id": "cc2484b9-6555-448e-95b8-7dad347821ea", "certified": false, "is_primary": false, "skill_name": "Docker", "category_name": "Technical", "category_color": "#4F46E5", "years_experience": "0.0", "proficiency_level": 3}], "address": {}, "user_id": null, "timeline": [{"id": "8830ce04-ff22-4546-b04e-8f65b00d5142", "title": "Employee Onboarded", "metadata": {}, "created_at": "2026-06-11T09:21:07.036Z", "event_date": "2026-01-09T18:30:00.000Z", "event_type": "joined", "description": "Employee profile created", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "performed_by": "992a2f21-88a5-46ab-ac8f-1517251ff6f5", "performed_by_name": "Steve Smith", "performed_by_email": "mailtokrishnawork@gmail.com"}], "documents": [], "is_active": true, "last_name": "Roy", "role_name": null, "created_at": "2026-06-11T09:21:07.036Z", "created_by": "992a2f21-88a5-46ab-ac8f-1517251ff6f5", "deleted_at": null, "first_name": "Jason", "last_login": null, "manager_id": "8927edf5-b7ea-4559-b809-64d9dabf8224", "updated_at": "2026-06-11T10:07:48.562Z", "designation": "Cloud Engineer", "bank_details": {}, "joining_date": "2026-01-09T18:30:00.000Z", "linkedin_url": null, "manager_code": "EMP0021", "date_of_birth": "1992-01-11T18:30:00.000Z", "department_id": "22222222-2222-2222-2222-222222222001", "employee_code": "EMP0022", "leaveBalances": [{"id": "dd538911-5fce-4ed4-8078-1db0bd29503d", "code": "CL", "year": 2026, "color": "#4F46E5", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "9804a195-ac58-48e2-8246-0d03e64586c4", "allocated_days": "12.0", "leave_type_name": "Casual Leave", "carried_forward_days": "0.0"}, {"id": "a931957f-929e-4abc-b46d-b6b7d41ac217", "code": "SL", "year": 2026, "color": "#DC2626", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "6a6fef3e-9d81-4a76-8a00-de51d30242f0", "allocated_days": "10.0", "leave_type_name": "Sick Leave", "carried_forward_days": "0.0"}, {"id": "30a424f8-c87e-4b3a-8513-55a5b2691576", "code": "PL", "year": 2026, "color": "#059669", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "1918f399-69ab-4ab7-8d9a-a22aa8e5e87f", "allocated_days": "15.0", "leave_type_name": "Paid Leave", "carried_forward_days": "0.0"}, {"id": "6acc6695-f681-44e9-a989-541b16dad187", "code": "UL", "year": 2026, "color": "#6B7280", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "71e17a24-c308-46e2-aed4-56b5a4930769", "allocated_days": "30.0", "leave_type_name": "Unpaid Leave", "carried_forward_days": "0.0"}, {"id": "9900ccca-8238-4b3c-bd36-a0291175d5d7", "code": "EL", "year": 2026, "color": "#D97706", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "f4b31609-0408-4431-993c-35d52cce69c3", "allocated_days": "3.0", "leave_type_name": "Emergency Leave", "carried_forward_days": "0.0"}, {"id": "ce71e5a7-5bba-45e3-bd25-20153c5d85f7", "code": "ML", "year": 2026, "color": "#7C3AED", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "7b1c55f4-c01e-4de5-a427-5110c4d6a3cb", "allocated_days": "182.0", "leave_type_name": "Maternity Leave", "carried_forward_days": "0.0"}, {"id": "e50a1f32-f912-4003-b876-73bd971330de", "code": "PTL", "year": 2026, "color": "#0047AB", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d", "allocated_days": "15.0", "leave_type_name": "Paternity Leave", "carried_forward_days": "0.0"}, {"id": "5a965fb5-d5d6-4ce4-a4ad-436dbef92766", "code": "BL", "year": 2026, "color": "#374151", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "52d845dd-9b8f-498d-b57f-26a07cd8697a", "allocated_days": "5.0", "leave_type_name": "Bereavement Leave", "carried_forward_days": "0.0"}], "account_active": null, "personal_email": "jasonroy@email.com", "department_code": "ENG", "department_name": "Engineering", "employment_type": "contract", "manager_picture": "/uploads/profiles/bbbd34f4-21cb-4b4a-b035-f49315ee0029.jfif", "resignation_date": null, "confirmation_date": null, "emergency_contact": {}, "employment_status": "inactive", "last_working_date": null, "manager_last_name": "Smith", "manager_first_name": "Steve", "profile_picture_url": "/uploads/profiles/51a2d3ff-1bfa-4cd2-a765-f8ad933ec790.jpeg"}	{"id": "de751bd0-7050-436f-b5ac-253242ceaf20", "bio": null, "phone": "+1 945249532450", "gender": "male", "salary": "750000.00", "address": {}, "user_id": null, "is_active": true, "last_name": "Roy", "created_at": "2026-06-11T09:21:07.036Z", "created_by": "992a2f21-88a5-46ab-ac8f-1517251ff6f5", "deleted_at": null, "first_name": "Jason", "manager_id": "8927edf5-b7ea-4559-b809-64d9dabf8224", "updated_at": "2026-06-11T10:22:37.705Z", "designation": "Cloud Engineer", "bank_details": {}, "joining_date": "2026-01-09T18:30:00.000Z", "linkedin_url": null, "date_of_birth": "1992-01-11T18:30:00.000Z", "department_id": "22222222-2222-2222-2222-222222222001", "employee_code": "EMP0022", "personal_email": "jasonroy@email.com", "employment_type": "contract", "resignation_date": null, "confirmation_date": null, "emergency_contact": {}, "employment_status": "inactive", "last_working_date": null, "profile_picture_url": "/uploads/profiles/51a2d3ff-1bfa-4cd2-a765-f8ad933ec790.jpeg"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 15:52:37.864276+05:30
ea6d3b3f-4aad-4a4f-8861-d464eeade3a1	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	UPDATE_EMPLOYEE	employee	de751bd0-7050-436f-b5ac-253242ceaf20	{"id": "de751bd0-7050-436f-b5ac-253242ceaf20", "bio": null, "email": null, "phone": "+1 945249532450", "gender": "male", "salary": "750000.00", "skills": [{"id": "6d841364-2fd7-44e6-847f-4620f2f4e427", "skill_id": "0a1a91a3-b356-45bf-9f21-f440a0c9be19", "certified": false, "is_primary": false, "skill_name": "Problem Solving", "category_name": "Soft Skills", "category_color": "#7C3AED", "years_experience": "0.0", "proficiency_level": 3}, {"id": "50a3f79c-56b4-4862-a6b7-158948de1e61", "skill_id": "1e52aea4-0146-43fe-b8a3-e20762c31324", "certified": false, "is_primary": false, "skill_name": "Testing", "category_name": "Technical", "category_color": "#4F46E5", "years_experience": "0.0", "proficiency_level": 3}, {"id": "e9aa153c-bd99-4811-8350-5d63cc53320a", "skill_id": "272634b1-41ea-4b4d-9416-f4ac92b97436", "certified": false, "is_primary": false, "skill_name": "Agile/Scrum", "category_name": "Management", "category_color": "#0047AB", "years_experience": "0.0", "proficiency_level": 3}, {"id": "a291d55d-c250-48c3-8aa9-46e30f201bc2", "skill_id": "2a938e15-c35a-4b01-8223-799cb65999de", "certified": false, "is_primary": false, "skill_name": "Project Management", "category_name": "Management", "category_color": "#0047AB", "years_experience": "0.0", "proficiency_level": 3}, {"id": "971f110e-5c15-4995-bd90-90089f1531c7", "skill_id": "9c4302ca-7ab6-4247-8db1-4953c3d1fd3d", "certified": false, "is_primary": false, "skill_name": "Man Management", "category_name": "Soft Skills", "category_color": "#7C3AED", "years_experience": "0.0", "proficiency_level": 3}, {"id": "0d0a0266-8a68-47a7-aa14-9f9991bc83ca", "skill_id": "a33babe3-5fee-4c2a-a2d5-c6511e5f151b", "certified": false, "is_primary": false, "skill_name": "DevOps", "category_name": "Technical", "category_color": "#4F46E5", "years_experience": "0.0", "proficiency_level": 3}, {"id": "d939e41e-90c1-4917-9b7e-33a9a7ea4665", "skill_id": "cc2484b9-6555-448e-95b8-7dad347821ea", "certified": false, "is_primary": false, "skill_name": "Docker", "category_name": "Technical", "category_color": "#4F46E5", "years_experience": "0.0", "proficiency_level": 3}], "address": {}, "user_id": null, "timeline": [{"id": "8830ce04-ff22-4546-b04e-8f65b00d5142", "title": "Employee Onboarded", "metadata": {}, "created_at": "2026-06-11T09:21:07.036Z", "event_date": "2026-01-09T18:30:00.000Z", "event_type": "joined", "description": "Employee profile created", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "performed_by": "992a2f21-88a5-46ab-ac8f-1517251ff6f5", "performed_by_name": "Steve Smith", "performed_by_email": "mailtokrishnawork@gmail.com"}], "documents": [], "is_active": true, "last_name": "Roy", "role_name": null, "created_at": "2026-06-11T09:21:07.036Z", "created_by": "992a2f21-88a5-46ab-ac8f-1517251ff6f5", "deleted_at": null, "first_name": "Jason", "last_login": null, "manager_id": "8927edf5-b7ea-4559-b809-64d9dabf8224", "updated_at": "2026-06-11T10:22:37.705Z", "designation": "Cloud Engineer", "bank_details": {}, "joining_date": "2026-01-09T18:30:00.000Z", "linkedin_url": null, "manager_code": "EMP0021", "date_of_birth": "1992-01-11T18:30:00.000Z", "department_id": "22222222-2222-2222-2222-222222222001", "employee_code": "EMP0022", "leaveBalances": [{"id": "dd538911-5fce-4ed4-8078-1db0bd29503d", "code": "CL", "year": 2026, "color": "#4F46E5", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "9804a195-ac58-48e2-8246-0d03e64586c4", "allocated_days": "12.0", "leave_type_name": "Casual Leave", "carried_forward_days": "0.0"}, {"id": "a931957f-929e-4abc-b46d-b6b7d41ac217", "code": "SL", "year": 2026, "color": "#DC2626", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "6a6fef3e-9d81-4a76-8a00-de51d30242f0", "allocated_days": "10.0", "leave_type_name": "Sick Leave", "carried_forward_days": "0.0"}, {"id": "30a424f8-c87e-4b3a-8513-55a5b2691576", "code": "PL", "year": 2026, "color": "#059669", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "1918f399-69ab-4ab7-8d9a-a22aa8e5e87f", "allocated_days": "15.0", "leave_type_name": "Paid Leave", "carried_forward_days": "0.0"}, {"id": "6acc6695-f681-44e9-a989-541b16dad187", "code": "UL", "year": 2026, "color": "#6B7280", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "71e17a24-c308-46e2-aed4-56b5a4930769", "allocated_days": "30.0", "leave_type_name": "Unpaid Leave", "carried_forward_days": "0.0"}, {"id": "9900ccca-8238-4b3c-bd36-a0291175d5d7", "code": "EL", "year": 2026, "color": "#D97706", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "f4b31609-0408-4431-993c-35d52cce69c3", "allocated_days": "3.0", "leave_type_name": "Emergency Leave", "carried_forward_days": "0.0"}, {"id": "ce71e5a7-5bba-45e3-bd25-20153c5d85f7", "code": "ML", "year": 2026, "color": "#7C3AED", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "7b1c55f4-c01e-4de5-a427-5110c4d6a3cb", "allocated_days": "182.0", "leave_type_name": "Maternity Leave", "carried_forward_days": "0.0"}, {"id": "e50a1f32-f912-4003-b876-73bd971330de", "code": "PTL", "year": 2026, "color": "#0047AB", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d", "allocated_days": "15.0", "leave_type_name": "Paternity Leave", "carried_forward_days": "0.0"}, {"id": "5a965fb5-d5d6-4ce4-a4ad-436dbef92766", "code": "BL", "year": 2026, "color": "#374151", "used_days": "0.0", "created_at": "2026-06-11T09:21:07.036Z", "updated_at": "2026-06-11T09:21:07.036Z", "employee_id": "de751bd0-7050-436f-b5ac-253242ceaf20", "pending_days": "0.0", "leave_type_id": "52d845dd-9b8f-498d-b57f-26a07cd8697a", "allocated_days": "5.0", "leave_type_name": "Bereavement Leave", "carried_forward_days": "0.0"}], "account_active": null, "personal_email": "jasonroy@email.com", "department_code": "ENG", "department_name": "Engineering", "employment_type": "contract", "manager_picture": "/uploads/profiles/bbbd34f4-21cb-4b4a-b035-f49315ee0029.jfif", "resignation_date": null, "confirmation_date": null, "emergency_contact": {}, "employment_status": "inactive", "last_working_date": null, "manager_last_name": "Smith", "manager_first_name": "Steve", "profile_picture_url": "/uploads/profiles/51a2d3ff-1bfa-4cd2-a765-f8ad933ec790.jpeg"}	{"id": "de751bd0-7050-436f-b5ac-253242ceaf20", "bio": null, "phone": "+1 945249532450", "gender": "male", "salary": "750000.00", "address": {}, "user_id": null, "is_active": true, "last_name": "Roy", "created_at": "2026-06-11T09:21:07.036Z", "created_by": "992a2f21-88a5-46ab-ac8f-1517251ff6f5", "deleted_at": null, "first_name": "Jason", "manager_id": "8927edf5-b7ea-4559-b809-64d9dabf8224", "updated_at": "2026-06-11T10:23:45.793Z", "designation": "Cloud Engineer", "bank_details": {}, "joining_date": "2026-06-09T18:30:00.000Z", "linkedin_url": null, "date_of_birth": "1992-01-11T18:30:00.000Z", "department_id": "22222222-2222-2222-2222-222222222001", "employee_code": "EMP0022", "personal_email": "jasonroy@email.com", "employment_type": "contract", "resignation_date": null, "confirmation_date": null, "emergency_contact": {}, "employment_status": "active", "last_working_date": null, "profile_picture_url": "/uploads/profiles/51a2d3ff-1bfa-4cd2-a765-f8ad933ec790.jpeg"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 15:53:46.434632+05:30
a5544412-f3a8-4973-ac45-9dadd1f8245b	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGOUT	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 16:02:28.575431+05:30
b6260f0d-15f2-4d12-a8cc-31f70a115ed3	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 16:02:53.897782+05:30
a7db07fc-90d7-4c41-b338-8d7668f00bbf	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 16:20:09.84129+05:30
2fefb956-c9ac-484f-9d34-be7ca764ac7c	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	DELETE_EMPLOYEE	employee	44444444-4444-4444-4444-444444444003	{"id": "44444444-4444-4444-4444-444444444003", "bio": null, "email": "manager@peopleflow.io", "phone": null, "gender": null, "salary": null, "skills": [], "address": {}, "user_id": "33333333-3333-3333-3333-333333333003", "timeline": [], "documents": [], "is_active": true, "last_name": "Thompson", "role_name": "manager", "created_at": "2026-06-10T11:13:38.125Z", "created_by": null, "deleted_at": null, "first_name": "Marcus", "last_login": null, "manager_id": null, "updated_at": "2026-06-10T11:13:38.125Z", "designation": "Engineering Manager", "bank_details": {}, "joining_date": "2020-05-31T18:30:00.000Z", "linkedin_url": null, "manager_code": null, "date_of_birth": null, "department_id": "22222222-2222-2222-2222-222222222001", "employee_code": "EMP0003", "leaveBalances": [{"id": "ac2a6e7c-b79b-4a27-a5b5-0a52aa2b8586", "code": "CL", "year": 2026, "color": "#4F46E5", "used_days": "0.0", "created_at": "2026-06-10T11:13:38.125Z", "updated_at": "2026-06-10T11:13:38.125Z", "employee_id": "44444444-4444-4444-4444-444444444003", "pending_days": "0.0", "leave_type_id": "9804a195-ac58-48e2-8246-0d03e64586c4", "allocated_days": "12.0", "leave_type_name": "Casual Leave", "carried_forward_days": "0.0"}, {"id": "a75e7fda-9e58-4721-9328-c98f1ca97022", "code": "SL", "year": 2026, "color": "#DC2626", "used_days": "0.0", "created_at": "2026-06-10T11:13:38.125Z", "updated_at": "2026-06-10T11:13:38.125Z", "employee_id": "44444444-4444-4444-4444-444444444003", "pending_days": "0.0", "leave_type_id": "6a6fef3e-9d81-4a76-8a00-de51d30242f0", "allocated_days": "10.0", "leave_type_name": "Sick Leave", "carried_forward_days": "0.0"}, {"id": "0a0770a1-9012-4cf2-82c5-91c5b727302c", "code": "PL", "year": 2026, "color": "#059669", "used_days": "0.0", "created_at": "2026-06-10T11:13:38.125Z", "updated_at": "2026-06-10T11:13:38.125Z", "employee_id": "44444444-4444-4444-4444-444444444003", "pending_days": "0.0", "leave_type_id": "1918f399-69ab-4ab7-8d9a-a22aa8e5e87f", "allocated_days": "15.0", "leave_type_name": "Paid Leave", "carried_forward_days": "0.0"}, {"id": "873441c4-6704-4dba-8f99-e3efc759ba8c", "code": "UL", "year": 2026, "color": "#6B7280", "used_days": "0.0", "created_at": "2026-06-10T11:13:38.125Z", "updated_at": "2026-06-10T11:13:38.125Z", "employee_id": "44444444-4444-4444-4444-444444444003", "pending_days": "0.0", "leave_type_id": "71e17a24-c308-46e2-aed4-56b5a4930769", "allocated_days": "30.0", "leave_type_name": "Unpaid Leave", "carried_forward_days": "0.0"}, {"id": "c874357e-b43d-4972-bdef-a71433665faa", "code": "EL", "year": 2026, "color": "#D97706", "used_days": "0.0", "created_at": "2026-06-10T11:13:38.125Z", "updated_at": "2026-06-10T11:13:38.125Z", "employee_id": "44444444-4444-4444-4444-444444444003", "pending_days": "0.0", "leave_type_id": "f4b31609-0408-4431-993c-35d52cce69c3", "allocated_days": "3.0", "leave_type_name": "Emergency Leave", "carried_forward_days": "0.0"}, {"id": "a62f22fa-b5e3-45f7-a8eb-4ed135580409", "code": "ML", "year": 2026, "color": "#7C3AED", "used_days": "0.0", "created_at": "2026-06-10T11:13:38.125Z", "updated_at": "2026-06-10T11:13:38.125Z", "employee_id": "44444444-4444-4444-4444-444444444003", "pending_days": "0.0", "leave_type_id": "7b1c55f4-c01e-4de5-a427-5110c4d6a3cb", "allocated_days": "182.0", "leave_type_name": "Maternity Leave", "carried_forward_days": "0.0"}, {"id": "290f96de-754c-4e5b-b6de-8f44c6a85c3e", "code": "PTL", "year": 2026, "color": "#0047AB", "used_days": "0.0", "created_at": "2026-06-10T11:13:38.125Z", "updated_at": "2026-06-10T11:13:38.125Z", "employee_id": "44444444-4444-4444-4444-444444444003", "pending_days": "0.0", "leave_type_id": "ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d", "allocated_days": "15.0", "leave_type_name": "Paternity Leave", "carried_forward_days": "0.0"}, {"id": "f6c903a9-d6d3-495f-8aeb-b268435e584d", "code": "BL", "year": 2026, "color": "#374151", "used_days": "0.0", "created_at": "2026-06-10T11:13:38.125Z", "updated_at": "2026-06-10T11:13:38.125Z", "employee_id": "44444444-4444-4444-4444-444444444003", "pending_days": "0.0", "leave_type_id": "52d845dd-9b8f-498d-b57f-26a07cd8697a", "allocated_days": "5.0", "leave_type_name": "Bereavement Leave", "carried_forward_days": "0.0"}], "account_active": true, "personal_email": null, "department_code": "ENG", "department_name": "Engineering", "employment_type": "full_time", "manager_picture": null, "resignation_date": null, "confirmation_date": null, "emergency_contact": {}, "employment_status": "active", "last_working_date": null, "manager_last_name": null, "manager_first_name": null, "profile_picture_url": null}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 16:24:27.620993+05:30
3604594e-8d8f-417e-b3b7-572ae10e1394	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 16:35:36.346343+05:30
d33a7c04-84f6-4f7e-96f7-64bc19ede0eb	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	APPROVE_LEAVE	leave	88888888-8888-8888-8888-888888888004	{"status": "pending"}	{"status": "approved"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 16:36:06.526716+05:30
3d2f885c-880b-400d-8efa-9afa13ac3b4d	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 16:50:03.111281+05:30
3bdb245e-f271-430c-b4ff-c5463004bb56	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	CREATE_EMPLOYEE	employee	c4252c1f-5026-48a4-8595-c87c1e9f799d	\N	{"id": "c4252c1f-5026-48a4-8595-c87c1e9f799d", "bio": null, "phone": "+917869512376", "gender": "male", "salary": "15000000.00", "address": {}, "user_id": null, "is_active": true, "last_name": "Srinivasan", "created_at": "2026-06-11T11:23:19.105Z", "created_by": "992a2f21-88a5-46ab-ac8f-1517251ff6f5", "deleted_at": null, "first_name": "Arvind", "manager_id": null, "updated_at": "2026-06-11T11:23:19.105Z", "designation": "Chief Finance Officer", "bank_details": {}, "joining_date": "2018-10-31T18:30:00.000Z", "linkedin_url": null, "date_of_birth": "1994-09-20T18:30:00.000Z", "department_id": "22222222-2222-2222-2222-222222222005", "employee_code": "EMP0023", "personal_email": "aravind@peopleflow.com", "employment_type": "full_time", "resignation_date": null, "confirmation_date": null, "emergency_contact": {}, "employment_status": "active", "last_working_date": null, "profile_picture_url": null}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 16:53:19.466909+05:30
6d9b6f24-d89e-49c2-bf39-648406f1d358	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGOUT	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 17:02:01.362958+05:30
b821949f-b3ab-414b-b454-b723de614dcb	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 17:17:08.220744+05:30
a17e9dd0-94b0-4ecc-9d22-eb39c2a0864b	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGOUT	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 17:22:34.959645+05:30
ae65d4ea-1b79-4ce4-b709-1e63e4f534e3	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	LOGIN	auth	992a2f21-88a5-46ab-ac8f-1517251ff6f5	\N	{"email": "mailtokrishnawork@gmail.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 17:24:29.570278+05:30
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, code, description, head_employee_id, parent_department_id, budget, location, is_active, created_at, updated_at, deleted_at) FROM stdin;
22222222-2222-2222-2222-222222222001	Engineering	ENG	Software Engineering & Development	\N	\N	\N	Floor 3	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30	\N
22222222-2222-2222-2222-222222222002	Human Resources	HR	People Operations & Culture	\N	\N	\N	Floor 1	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30	\N
22222222-2222-2222-2222-222222222003	Product	PROD	Product Management & Design	\N	\N	\N	Floor 2	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30	\N
22222222-2222-2222-2222-222222222004	Sales	SALES	Revenue & Business Development	\N	\N	\N	Floor 1	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30	\N
22222222-2222-2222-2222-222222222005	Finance	FIN	Financial Operations & Accounting	\N	\N	\N	Floor 2	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30	\N
22222222-2222-2222-2222-222222222006	Marketing	MKT	Brand, Content & Digital Marketing	\N	\N	\N	Floor 1	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30	\N
22222222-2222-2222-2222-222222222007	Operations	OPS	Business Operations & Administration	\N	\N	\N	Floor 4	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30	\N
22222222-2222-2222-2222-222222222008	Legal	LEG	Legal & Compliance	\N	\N	\N	Floor 5	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30	\N
55555555-5555-5555-5555-555555555001	Software Development	SOFTDEV	Application engineering and delivery	\N	\N	\N	Indore	t	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
55555555-5555-5555-5555-555555555002	Quality Assurance	QA	Testing, release validation, and quality control	\N	\N	\N	Indore	t	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
55555555-5555-5555-5555-555555555003	Digital Marketing	DMKT	Digital campaigns and growth marketing	\N	\N	\N	Indore	t	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
55555555-5555-5555-5555-555555555004	Technical Support	TSUP	Customer support and technical operations	\N	\N	\N	Indore	t	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, employee_id, uploaded_by, document_type, document_name, file_name, file_path, file_size, mime_type, is_verified, verified_by, verified_at, expiry_date, notes, created_at, updated_at, deleted_at) FROM stdin;
e8a20b76-7c60-4b7c-91f4-3286ff21fd40	de751bd0-7050-436f-b5ac-253242ceaf20	992a2f21-88a5-46ab-ac8f-1517251ff6f5	document	demo	e325743d-d032-4863-9b6c-d4eb102d14aa.docx	/uploads/documents/e325743d-d032-4863-9b6c-d4eb102d14aa.docx	18103	application/vnd.openxmlformats-officedocument.wordprocessingml.document	f	\N	\N	2026-06-19	asdslckfbndx	2026-06-11 16:04:44.325348+05:30	2026-06-11 16:04:44.325348+05:30	\N
\.


--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_verification_tokens (id, user_id, token_hash, expires_at, verified_at, created_at) FROM stdin;
a243b726-575a-468d-9357-db67b1cedab4	972853fe-2973-4500-a589-a92e1b1c5f84	106ac0b27c96a2092a060e19bbed88e99eb1827b0ed2b6312579fc3ba9f90496	2026-06-12 03:30:38.110092+05:30	2026-06-11 03:42:46.277684+05:30	2026-06-11 03:30:38.110092+05:30
096f953b-b245-4940-bc17-0b1ed02ad659	6c2557fa-80e3-47f1-8790-6dc4c96266c8	d1b7a7d5c0815c78312659f86384c3763dfa57487d0227fdf03b7b6ec0d9d314	2026-06-12 04:02:43.073389+05:30	\N	2026-06-11 04:02:43.073389+05:30
0e9602ac-2245-48ef-abd0-39b35e5dff0f	66e8a748-2e72-4f59-92ed-30bddfc94754	f32a5f0d8c4fc5946e0f47e25873254ee93cbdb9635e1fdc9f0e182b5ccbf9b4	2026-06-12 04:07:03.799146+05:30	\N	2026-06-11 04:07:03.799146+05:30
9be964bd-9161-44a4-b1f6-0a20e47ba0d6	dd3c88e8-40e4-4231-9170-a5c867e783e3	57e12c9c2e94d950ea86f68de5922ea551bfe7ec1cefd65bf1a0fef063e5d3a7	2026-06-12 04:25:47.14449+05:30	2026-06-11 04:27:21.515648+05:30	2026-06-11 04:25:47.14449+05:30
72f5969e-b0e6-459e-acb4-2a9700a7f168	63ac5f49-c951-4493-a1d2-a181f761ff80	6c6d8caf82f4f7cdf1c1ef21a6b22be38e86fb39baf558037c3c2353c6a0a1d9	2026-06-12 12:24:52.1012+05:30	\N	2026-06-11 12:24:52.1012+05:30
bd76c684-6f9d-4c26-ac9f-129bc86fb9a1	992a2f21-88a5-46ab-ac8f-1517251ff6f5	93d1ad31b5f7c4597936d7bf3699db046e8d94077dbcd9e653f385a9e371a456	2026-06-12 12:37:57.883031+05:30	2026-06-11 12:38:14.281368+05:30	2026-06-11 12:37:57.883031+05:30
\.


--
-- Data for Name: employee_skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_skills (id, employee_id, skill_id, proficiency_level, years_experience, is_primary, certified, certification_url, acquired_date, created_at, updated_at) FROM stdin;
c0052036-e117-4924-bde8-1544ea08c058	77777777-7777-7777-7777-777777777007	f7c1c6e4-7c6a-4b04-a79e-254fcb2d3731	3	1.5	f	f	\N	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
e11d6c8f-7c86-4743-a568-be2b7fde183f	77777777-7777-7777-7777-777777777005	f7c1c6e4-7c6a-4b04-a79e-254fcb2d3731	4	3.0	f	f	\N	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
09fe710b-32b9-49d1-bfbd-191570dabff1	77777777-7777-7777-7777-777777777004	f7c1c6e4-7c6a-4b04-a79e-254fcb2d3731	4	3.0	f	f	\N	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
e7a70a04-2245-4bae-a956-d502b1d68d34	77777777-7777-7777-7777-777777777010	a5a976ff-5228-4d36-bed5-b1076d8181db	3	2.0	f	f	\N	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
1bfb02a5-75f2-43b2-9eb0-489efb8a5074	77777777-7777-7777-7777-777777777009	65f346b8-b3da-4c34-8015-0168433912cd	3	1.0	f	f	\N	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
bfca5ce2-94d2-4bfb-b43b-9bf46902dbb1	77777777-7777-7777-7777-777777777005	65f346b8-b3da-4c34-8015-0168433912cd	3	2.0	f	f	\N	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
419216cb-95ed-4f61-8d53-d24c426c346e	77777777-7777-7777-7777-777777777004	27e9471c-34de-426d-9081-61ed8c33059e	4	2.5	t	f	\N	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
35dc3cd4-504a-4b47-b85e-f5f868e93c40	77777777-7777-7777-7777-777777777009	3a3c7f34-116e-4699-98f3-0a384b37c3f1	3	1.5	f	f	\N	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
b1478d5e-adc8-4acd-9c5b-13c874a76136	77777777-7777-7777-7777-777777777005	3a3c7f34-116e-4699-98f3-0a384b37c3f1	4	3.0	t	f	\N	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
5f6fb9b2-bbad-4fa2-a57e-cda59b2e59f7	77777777-7777-7777-7777-777777777004	ddae1e2a-8c26-4afc-9938-8b81518ab73b	4	3.0	f	f	\N	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
86defb51-9c7a-4150-a908-b5c177365c3e	77777777-7777-7777-7777-777777777006	1e52aea4-0146-43fe-b8a3-e20762c31324	4	4.0	t	f	\N	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
69a36799-abe3-416e-9f52-a055c7f64eb1	77777777-7777-7777-7777-777777777008	6aee422d-6cb6-4dd9-b95c-508bb6286072	3	2.0	t	f	\N	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
9495b0fb-88cb-4b34-be4c-348de6d10463	de751bd0-7050-436f-b5ac-253242ceaf20	272634b1-41ea-4b4d-9416-f4ac92b97436	3	0.0	f	f	\N	\N	2026-06-11 15:53:46.412156+05:30	2026-06-11 15:53:46.412156+05:30
256d8519-c74e-465c-bb8b-903968c3fbc6	de751bd0-7050-436f-b5ac-253242ceaf20	a33babe3-5fee-4c2a-a2d5-c6511e5f151b	3	0.0	f	f	\N	\N	2026-06-11 15:53:46.420485+05:30	2026-06-11 15:53:46.420485+05:30
cec38ece-e561-4ec5-9df6-c841a607c34b	de751bd0-7050-436f-b5ac-253242ceaf20	cc2484b9-6555-448e-95b8-7dad347821ea	3	0.0	f	f	\N	\N	2026-06-11 15:53:46.424724+05:30	2026-06-11 15:53:46.424724+05:30
669b17e8-4a65-4774-b281-55cb740ea1f2	de751bd0-7050-436f-b5ac-253242ceaf20	9c4302ca-7ab6-4247-8db1-4953c3d1fd3d	3	0.0	f	f	\N	\N	2026-06-11 15:53:46.427932+05:30	2026-06-11 15:53:46.427932+05:30
b581b874-4a36-4d9f-bf0a-53ef1711902d	c4252c1f-5026-48a4-8595-c87c1e9f799d	182ba4f5-47cb-45b3-9a45-f64d50f0db02	5	0.0	f	f	\N	\N	2026-06-11 16:53:19.105322+05:30	2026-06-11 16:53:19.105322+05:30
bae48ef0-3960-404f-bae3-c2dd0f540f60	c4252c1f-5026-48a4-8595-c87c1e9f799d	9c835835-5b75-44f5-9b4f-5e6d89b0ff94	5	0.0	f	f	\N	\N	2026-06-11 16:53:19.105322+05:30	2026-06-11 16:53:19.105322+05:30
e1abac4a-a7bb-48dd-b185-83e1f8349d07	c4252c1f-5026-48a4-8595-c87c1e9f799d	0a1a91a3-b356-45bf-9f21-f440a0c9be19	5	0.0	f	f	\N	\N	2026-06-11 16:53:19.105322+05:30	2026-06-11 16:53:19.105322+05:30
\.


--
-- Data for Name: employee_timeline; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_timeline (id, employee_id, event_type, title, description, event_date, performed_by, metadata, created_at) FROM stdin;
0c9de43b-504a-4b1e-bef2-1c92a042d63b	77777777-7777-7777-7777-777777777001	joined	Employee onboarded	Imported from i-SOFTZONE demo dataset	2020-01-15	66666666-6666-6666-6666-666666666001	{}	2026-06-11 03:18:16.72728+05:30
50b035b3-7e54-4d74-b55c-a143624a7e81	77777777-7777-7777-7777-777777777002	joined	Employee onboarded	Imported from i-SOFTZONE demo dataset	2021-04-01	66666666-6666-6666-6666-666666666002	{}	2026-06-11 03:18:16.72728+05:30
1fc8e391-4b13-4ce2-8370-3e6ea3e85cbd	77777777-7777-7777-7777-777777777003	joined	Employee onboarded	Imported from i-SOFTZONE demo dataset	2021-09-10	66666666-6666-6666-6666-666666666003	{}	2026-06-11 03:18:16.72728+05:30
3113876f-68cc-4937-9775-ea603a327a82	77777777-7777-7777-7777-777777777004	joined	Employee onboarded	Imported from i-SOFTZONE demo dataset	2024-02-12	66666666-6666-6666-6666-666666666004	{}	2026-06-11 03:18:16.72728+05:30
422f08b5-a2e3-4a70-9c1d-7ab34b6c67eb	77777777-7777-7777-7777-777777777005	joined	Employee onboarded	Imported from i-SOFTZONE demo dataset	2024-03-18	66666666-6666-6666-6666-666666666005	{}	2026-06-11 03:18:16.72728+05:30
9b7211ba-ae4c-4e4f-820e-a628a6d3062a	77777777-7777-7777-7777-777777777006	joined	Employee onboarded	Imported from i-SOFTZONE demo dataset	2024-08-05	66666666-6666-6666-6666-666666666006	{}	2026-06-11 03:18:16.72728+05:30
30eda88a-e9ed-41ac-9a2b-257775078ebd	77777777-7777-7777-7777-777777777007	joined	Employee onboarded	Imported from i-SOFTZONE demo dataset	2025-01-20	66666666-6666-6666-6666-666666666007	{}	2026-06-11 03:18:16.72728+05:30
5bd3a8ed-cbcf-403b-857b-3313a10349e7	77777777-7777-7777-7777-777777777008	joined	Employee onboarded	Imported from i-SOFTZONE demo dataset	2025-02-11	66666666-6666-6666-6666-666666666008	{}	2026-06-11 03:18:16.72728+05:30
ba119ad5-4303-43f1-8092-6748d4062c1f	77777777-7777-7777-7777-777777777009	joined	Employee onboarded	Imported from i-SOFTZONE demo dataset	2025-05-15	66666666-6666-6666-6666-666666666009	{}	2026-06-11 03:18:16.72728+05:30
2335a3a1-8615-4b93-b02b-4d3042346ae7	77777777-7777-7777-7777-777777777010	joined	Employee onboarded	Imported from i-SOFTZONE demo dataset	2025-07-01	66666666-6666-6666-6666-666666666010	{}	2026-06-11 03:18:16.72728+05:30
8830ce04-ff22-4546-b04e-8f65b00d5142	de751bd0-7050-436f-b5ac-253242ceaf20	joined	Employee Onboarded	Employee profile created	2026-01-10	992a2f21-88a5-46ab-ac8f-1517251ff6f5	{}	2026-06-11 14:51:07.036097+05:30
842eb370-957c-48fe-8bf3-4718c0ecde45	c4252c1f-5026-48a4-8595-c87c1e9f799d	joined	Employee Onboarded	Employee profile created	2018-11-01	992a2f21-88a5-46ab-ac8f-1517251ff6f5	{}	2026-06-11 16:53:19.105322+05:30
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, user_id, employee_code, first_name, last_name, date_of_birth, gender, phone, personal_email, address, emergency_contact, department_id, designation, employment_type, employment_status, joining_date, confirmation_date, resignation_date, last_working_date, manager_id, salary, bank_details, profile_picture_url, bio, linkedin_url, is_active, created_by, created_at, updated_at, deleted_at) FROM stdin;
44444444-4444-4444-4444-444444444001	33333333-3333-3333-3333-333333333001	EMP0001	System	Admin	\N	\N	\N	\N	{}	{}	22222222-2222-2222-2222-222222222007	System Administrator	full_time	active	2020-01-01	\N	\N	\N	\N	\N	{}	\N	\N	\N	t	\N	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30	\N
44444444-4444-4444-4444-444444444002	33333333-3333-3333-3333-333333333002	EMP0002	Sarah	Chen	\N	\N	\N	\N	{}	{}	22222222-2222-2222-2222-222222222002	HR Manager	full_time	active	2021-03-15	\N	\N	\N	\N	\N	{}	\N	\N	\N	t	\N	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30	\N
f86516e6-a1b5-4ffb-b46e-f6c5c7154cd4	ec77b8f8-3848-4b3e-ab61-e733a21c432c	EMP0004	John	Cena	\N	\N	\N	johnthedon@wwe.com	{}	{}	\N	\N	full_time	active	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	t	\N	2026-06-10 20:02:57.892617+05:30	2026-06-10 20:02:57.892617+05:30	\N
77777777-7777-7777-7777-777777777001	66666666-6666-6666-6666-666666666001	ISO0001	Pranay	Gupta	\N	male	9876543210	pranay@isoftzone.com	{"city": "Indore", "country": "India"}	{}	55555555-5555-5555-5555-555555555001	Director	full_time	active	2020-01-15	\N	\N	\N	\N	150000.00	{}	\N	\N	\N	t	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
77777777-7777-7777-7777-777777777002	66666666-6666-6666-6666-666666666002	ISO0002	Rahul	Sharma	\N	male	9876543211	rahul@isoftzone.com	{"city": "Indore", "country": "India"}	{}	55555555-5555-5555-5555-555555555001	Project Manager	full_time	active	2021-04-01	\N	\N	\N	77777777-7777-7777-7777-777777777001	85000.00	{}	\N	\N	\N	t	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
77777777-7777-7777-7777-777777777003	66666666-6666-6666-6666-666666666003	ISO0003	Priya	Verma	\N	female	9876543212	priya@isoftzone.com	{"city": "Indore", "country": "India"}	{}	22222222-2222-2222-2222-222222222002	HR Manager	full_time	active	2021-09-10	\N	\N	\N	77777777-7777-7777-7777-777777777001	70000.00	{}	\N	\N	\N	t	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
77777777-7777-7777-7777-777777777004	66666666-6666-6666-6666-666666666004	ISO0004	Amit	Patel	\N	male	9876543213	amit@isoftzone.com	{"city": "Indore", "country": "India"}	{}	55555555-5555-5555-5555-555555555001	React Developer	full_time	active	2024-02-12	\N	\N	\N	77777777-7777-7777-7777-777777777002	45000.00	{}	\N	\N	\N	t	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
77777777-7777-7777-7777-777777777005	66666666-6666-6666-6666-666666666005	ISO0005	Neha	Jain	\N	female	9876543214	neha@isoftzone.com	{"city": "Indore", "country": "India"}	{}	55555555-5555-5555-5555-555555555001	Node Developer	full_time	active	2024-03-18	\N	\N	\N	77777777-7777-7777-7777-777777777002	50000.00	{}	\N	\N	\N	t	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
77777777-7777-7777-7777-777777777006	66666666-6666-6666-6666-666666666006	ISO0006	Rohit	Singh	\N	male	9876543215	rohit@isoftzone.com	{"city": "Indore", "country": "India"}	{}	55555555-5555-5555-5555-555555555002	QA Engineer	full_time	active	2024-08-05	\N	\N	\N	77777777-7777-7777-7777-777777777002	40000.00	{}	\N	\N	\N	t	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
77777777-7777-7777-7777-777777777007	66666666-6666-6666-6666-666666666007	ISO0007	Anjali	Gupta	\N	female	9876543216	anjali@isoftzone.com	{"city": "Indore", "country": "India"}	{}	55555555-5555-5555-5555-555555555003	Marketing Executive	full_time	active	2025-01-20	\N	\N	\N	77777777-7777-7777-7777-777777777003	35000.00	{}	\N	\N	\N	t	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
77777777-7777-7777-7777-777777777008	66666666-6666-6666-6666-666666666008	ISO0008	Vikas	Mehta	\N	male	9876543217	vikas@isoftzone.com	{"city": "Indore", "country": "India"}	{}	22222222-2222-2222-2222-222222222004	Sales Executive	full_time	active	2025-02-11	\N	\N	\N	77777777-7777-7777-7777-777777777002	38000.00	{}	\N	\N	\N	t	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
77777777-7777-7777-7777-777777777009	66666666-6666-6666-6666-666666666009	ISO0009	Pooja	Shah	\N	female	9876543218	pooja@isoftzone.com	{"city": "Indore", "country": "India"}	{}	55555555-5555-5555-5555-555555555004	Support Engineer	full_time	active	2025-05-15	\N	\N	\N	77777777-7777-7777-7777-777777777002	32000.00	{}	\N	\N	\N	t	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
77777777-7777-7777-7777-777777777010	66666666-6666-6666-6666-666666666010	ISO0010	Sandeep	Kumar	\N	male	9876543219	sandeep@isoftzone.com	{"city": "Indore", "country": "India"}	{}	22222222-2222-2222-2222-222222222005	Accountant	full_time	active	2025-07-01	\N	\N	\N	77777777-7777-7777-7777-777777777003	42000.00	{}	\N	\N	\N	t	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
b19bc9f3-9e2a-4de3-9ea5-a366f3a7e9b4	972853fe-2973-4500-a589-a92e1b1c5f84	EMP0015	Krishna	Tiwari	\N	\N	\N	kishankantt2007@gmail.com	{}	{}	\N	\N	full_time	active	\N	\N	\N	\N	\N	\N	{}	/uploads/profiles/be1f6740-85c4-483d-951f-a384bca946c3.jpg	\N	\N	t	\N	2026-06-11 03:30:38.110092+05:30	2026-06-11 03:45:20.791122+05:30	\N
3230c7f9-2dba-428d-a489-47d8bafd488a	6c2557fa-80e3-47f1-8790-6dc4c96266c8	EMP0016	Test	User	\N	\N	\N	user-31316342@example.com	{}	{}	\N	\N	full_time	active	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	t	\N	2026-06-11 04:02:43.073389+05:30	2026-06-11 04:02:43.073389+05:30	\N
7cb6b548-3ab5-4f6b-b5bd-918124e4da58	\N	EMP0017	Test	User	\N	\N	\N	user-678ddbc5@example.com	{}	{}	\N	\N	full_time	active	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	t	\N	2026-06-11 04:02:57.382198+05:30	2026-06-11 04:02:58.303555+05:30	\N
6b4ab0b0-a03d-4dfe-a278-c63f349b9f2c	66e8a748-2e72-4f59-92ed-30bddfc94754	EMP0018	neymar	jr	\N	\N	\N	ravikantsumeru@gmail.com	{}	{}	\N	\N	full_time	active	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	t	\N	2026-06-11 04:07:03.799146+05:30	2026-06-11 04:07:03.799146+05:30	\N
dfda650c-39c9-4391-871c-7cbd894cfcf3	dd3c88e8-40e4-4231-9170-a5c867e783e3	EMP0019	Krishna	Tiwari	\N	\N	\N	krsnaa135@gmail.com	{}	{}	\N	\N	full_time	active	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	t	\N	2026-06-11 04:25:47.14449+05:30	2026-06-11 04:25:47.14449+05:30	\N
bec54152-e465-4d38-bd15-cd500e3a50d4	63ac5f49-c951-4493-a1d2-a181f761ff80	EMP0020	Atiksh	Mishra	\N	\N	\N	atikshmmishra@gmail.com	{}	{}	\N	\N	full_time	active	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	t	\N	2026-06-11 12:24:52.1012+05:30	2026-06-11 12:24:52.1012+05:30	\N
8927edf5-b7ea-4559-b809-64d9dabf8224	992a2f21-88a5-46ab-ac8f-1517251ff6f5	EMP0021	Steve	Smith	\N	\N	\N	mailtokrishnawork@gmail.com	{}	{}	\N	\N	full_time	active	\N	\N	\N	\N	\N	\N	{}	/uploads/profiles/bbbd34f4-21cb-4b4a-b035-f49315ee0029.jfif	\N	\N	t	\N	2026-06-11 12:37:57.883031+05:30	2026-06-11 13:58:20.496443+05:30	\N
de751bd0-7050-436f-b5ac-253242ceaf20	\N	EMP0022	Jason	Roy	1992-01-12	male	+1 945249532450	jasonroy@email.com	{}	{}	22222222-2222-2222-2222-222222222001	Cloud Engineer	contract	active	2026-06-10	\N	\N	\N	8927edf5-b7ea-4559-b809-64d9dabf8224	750000.00	{}	/uploads/profiles/51a2d3ff-1bfa-4cd2-a765-f8ad933ec790.jpeg	\N	\N	t	992a2f21-88a5-46ab-ac8f-1517251ff6f5	2026-06-11 14:51:07.036097+05:30	2026-06-11 15:53:45.793958+05:30	\N
44444444-4444-4444-4444-444444444003	33333333-3333-3333-3333-333333333003	EMP0003	Marcus	Thompson	\N	\N	\N	\N	{}	{}	22222222-2222-2222-2222-222222222001	Engineering Manager	full_time	terminated	2020-06-01	\N	\N	\N	\N	\N	{}	\N	\N	\N	f	\N	2026-06-10 16:43:38.12592+05:30	2026-06-11 16:24:27.549277+05:30	2026-06-11 16:24:27.549277+05:30
c4252c1f-5026-48a4-8595-c87c1e9f799d	\N	EMP0023	Arvind	Srinivasan	1994-09-21	male	+917869512376	aravind@peopleflow.com	{}	{}	22222222-2222-2222-2222-222222222005	Chief Finance Officer	full_time	active	2018-11-01	\N	\N	\N	\N	15000000.00	{}	\N	\N	\N	t	992a2f21-88a5-46ab-ac8f-1517251ff6f5	2026-06-11 16:53:19.105322+05:30	2026-06-11 16:53:19.105322+05:30	\N
\.


--
-- Data for Name: leave_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_approvals (id, leave_request_id, approver_id, approver_role, stage, action, comment, actioned_at, created_at) FROM stdin;
f5b80d43-26c0-4174-b558-daa11c02572b	b39e4c96-3232-4e5d-9ac5-cffa0b3c5182	ec77b8f8-3848-4b3e-ab61-e733a21c432c	employee	0	applied	Leave application submitted	2026-06-10 20:06:01.177868+05:30	2026-06-10 20:06:01.177868+05:30
e2a1b639-74f0-4e60-b5ba-a0e50041cc22	4ac4d9b7-0082-4f37-9039-70805de4abd4	ec77b8f8-3848-4b3e-ab61-e733a21c432c	employee	0	applied	Leave application submitted	2026-06-10 20:29:27.046034+05:30	2026-06-10 20:29:27.046034+05:30
467b2856-e47a-43f4-bea9-24d73e727008	4ac4d9b7-0082-4f37-9039-70805de4abd4	c1b54692-fb97-46b0-a467-c9f3ca098c22	admin	2	approved	Approved	2026-06-10 20:30:26.406232+05:30	2026-06-10 20:30:26.406232+05:30
d54b0ec6-bd04-44cd-8f61-45c061cda730	88888888-8888-8888-8888-888888888001	66666666-6666-6666-6666-666666666002	manager	1	approved	Manager approved	2026-05-26 00:00:00+05:30	2026-06-11 03:18:16.72728+05:30
ed01ee19-126e-40cd-9991-1b65956a6366	88888888-8888-8888-8888-888888888001	66666666-6666-6666-6666-666666666003	hr	2	approved	HR approved	2026-05-27 00:00:00+05:30	2026-06-11 03:18:16.72728+05:30
2818fa8c-aa71-4cf8-a1a7-a7350428c1fd	88888888-8888-8888-8888-888888888003	66666666-6666-6666-6666-666666666002	manager	1	approved	Manager approved	2026-05-16 00:00:00+05:30	2026-06-11 03:18:16.72728+05:30
c6d352df-5a08-4273-886a-f5e404291eba	88888888-8888-8888-8888-888888888003	66666666-6666-6666-6666-666666666003	hr	2	approved	HR approved	2026-05-17 00:00:00+05:30	2026-06-11 03:18:16.72728+05:30
4de87dea-f7ae-4835-91e1-0a6dfbf9656d	88888888-8888-8888-8888-888888888005	66666666-6666-6666-6666-666666666002	manager	1	rejected	Insufficient reason	2026-06-08 00:00:00+05:30	2026-06-11 03:18:16.72728+05:30
d9862e72-a4d1-4ecc-b5f8-13b70ac1d33a	88888888-8888-8888-8888-888888888002	c1b54692-fb97-46b0-a467-c9f3ca098c22	admin	2	approved	Approved	2026-06-11 03:22:11.101802+05:30	2026-06-11 03:22:11.101802+05:30
e8427f83-3c34-4800-bb76-e2221c29b92e	88888888-8888-8888-8888-888888888004	992a2f21-88a5-46ab-ac8f-1517251ff6f5	hr	2	approved	Approved	2026-06-11 16:36:06.423024+05:30	2026-06-11 16:36:06.423024+05:30
\.


--
-- Data for Name: leave_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_balances (id, employee_id, leave_type_id, year, allocated_days, used_days, pending_days, carried_forward_days, created_at, updated_at) FROM stdin;
fedb95d2-1eb4-4677-92b4-32f55509fbbc	44444444-4444-4444-4444-444444444001	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
edac4db5-0e05-4b70-abf7-eb6c447fb1d3	44444444-4444-4444-4444-444444444002	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
ac2a6e7c-b79b-4a27-a5b5-0a52aa2b8586	44444444-4444-4444-4444-444444444003	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
047432f9-1273-4afb-b37d-9da560bf60de	44444444-4444-4444-4444-444444444001	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
5f0e75f1-538d-4f70-843a-315c474b2774	44444444-4444-4444-4444-444444444002	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
a75e7fda-9e58-4721-9328-c98f1ca97022	44444444-4444-4444-4444-444444444003	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
473d9596-595a-449e-afc4-20f3a1affe1c	44444444-4444-4444-4444-444444444001	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
7fac998f-b3a3-4cd1-8aa5-68cb231ed4fb	44444444-4444-4444-4444-444444444002	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
0a0770a1-9012-4cf2-82c5-91c5b727302c	44444444-4444-4444-4444-444444444003	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
2b0ccec9-fec3-407e-9150-228214719b03	44444444-4444-4444-4444-444444444001	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
9f137407-ed5a-48a5-bbf0-fd469855f83e	44444444-4444-4444-4444-444444444002	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
873441c4-6704-4dba-8f99-e3efc759ba8c	44444444-4444-4444-4444-444444444003	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
4a180f13-8fce-442d-abcd-817f0e4fac41	44444444-4444-4444-4444-444444444001	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
66074e29-68a2-4351-aecc-ee8d0d003c69	44444444-4444-4444-4444-444444444002	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
c874357e-b43d-4972-bdef-a71433665faa	44444444-4444-4444-4444-444444444003	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
2ffc4724-3f97-4716-a26a-e84dbdb30b52	44444444-4444-4444-4444-444444444001	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
c05536fb-fabe-4dab-bebe-3f2993937b6e	44444444-4444-4444-4444-444444444002	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
a62f22fa-b5e3-45f7-a8eb-4ed135580409	44444444-4444-4444-4444-444444444003	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
e8ec89b1-fb74-4805-9848-894710a0f0d4	44444444-4444-4444-4444-444444444001	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
6ed6e942-8d52-4f4f-92c0-3d30ec40572c	44444444-4444-4444-4444-444444444002	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
290f96de-754c-4e5b-b6de-8f44c6a85c3e	44444444-4444-4444-4444-444444444003	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
a0ca6540-80ee-4c48-8739-96dfd894fa83	44444444-4444-4444-4444-444444444001	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
c217b73e-6932-41d7-a673-87072f272917	44444444-4444-4444-4444-444444444002	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
f6c903a9-d6d3-495f-8aeb-b268435e584d	44444444-4444-4444-4444-444444444003	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
875b8373-63f4-419a-9cf3-0181cb8e1289	77777777-7777-7777-7777-777777777001	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
73e6cac3-6db7-49cb-b011-c377756d7927	77777777-7777-7777-7777-777777777001	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
8477f269-14db-4302-bedd-6017336c9b0f	77777777-7777-7777-7777-777777777001	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
88a46ad6-ea3a-4368-9a84-2d3bea83e270	77777777-7777-7777-7777-777777777001	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
7fd126e0-ff15-456f-afc5-a282d502e68d	77777777-7777-7777-7777-777777777001	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
08ef29ee-b0f6-41ec-af83-bc2eb94d9fc2	77777777-7777-7777-7777-777777777001	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
dff6d37d-cd5c-40f4-bf03-065e839bcef7	77777777-7777-7777-7777-777777777001	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
be8f99ce-3b4e-46d0-8add-ff43b067ccce	77777777-7777-7777-7777-777777777001	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
0ec33bc4-d032-4558-8bb8-eb4815fd634e	77777777-7777-7777-7777-777777777002	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
f7feac64-2ba7-48dc-a781-89979456db4d	77777777-7777-7777-7777-777777777002	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
8a352cb4-5ccd-4023-8fe8-acb63153b817	77777777-7777-7777-7777-777777777002	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
ad48113d-78cd-4e5b-a52b-7368cee82413	77777777-7777-7777-7777-777777777002	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
425fd5b9-3f8f-4cee-859b-3c5c26658a47	77777777-7777-7777-7777-777777777002	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
faf299dc-3c75-4bc8-9201-49cff135acf7	77777777-7777-7777-7777-777777777002	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
d2975a29-ca88-4c1b-83ee-7b8ba49917a8	77777777-7777-7777-7777-777777777002	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
aa00c565-37e3-4b7a-bb21-8acb5067ea05	77777777-7777-7777-7777-777777777002	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
ed55216c-77f9-40c4-933e-195d6c872d6c	77777777-7777-7777-7777-777777777003	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
9989a18e-11d7-4bc3-ab1b-c487869bd221	77777777-7777-7777-7777-777777777003	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
7de18707-19a6-4c24-94bd-ba53e1e4205d	77777777-7777-7777-7777-777777777003	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
0a545cce-ffd1-460e-9050-1b23bb6284e8	77777777-7777-7777-7777-777777777003	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
90104db2-d50d-400f-b63c-fbb904bd34eb	77777777-7777-7777-7777-777777777003	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
b80ff22f-2a4e-42a0-ba8f-53cfdefcac08	77777777-7777-7777-7777-777777777003	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
cb5ccc34-270d-4990-bc9a-55a1c2ed7d5d	77777777-7777-7777-7777-777777777003	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
11183379-5e8d-400f-8dec-f235944d3e21	77777777-7777-7777-7777-777777777003	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
e07284fd-b7ed-480e-a7f4-4d4d1d6668ec	77777777-7777-7777-7777-777777777004	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	2.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
7e8d3657-c111-4e60-802a-c6c2ef42c077	77777777-7777-7777-7777-777777777004	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
5e58d0f4-8553-4865-9b73-ca0fb4c08cff	77777777-7777-7777-7777-777777777004	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
d434094e-b666-44a0-885e-72ce529d1437	77777777-7777-7777-7777-777777777004	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
b5b2743f-9ad0-4963-a4cf-c89f4a1941d0	77777777-7777-7777-7777-777777777004	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
a6df4eaf-7ca9-4258-99f0-2a09d307a8e5	77777777-7777-7777-7777-777777777004	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
c53d5f7d-8f38-4889-88aa-b8b7a12f7903	77777777-7777-7777-7777-777777777004	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
15cdc1b9-3774-470f-b20e-605703e05fd6	77777777-7777-7777-7777-777777777004	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
c854b2fb-e30a-4e46-af34-a2dbcebbaa51	77777777-7777-7777-7777-777777777005	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	0.0	2.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
52db4baa-c432-41f9-85c0-fab1490b39ea	77777777-7777-7777-7777-777777777005	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
f37e37c5-ddfb-4b18-b1bb-f65c75e3bc9a	77777777-7777-7777-7777-777777777005	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
e31c83f4-c0d7-47cf-bbeb-d54d565d8e91	77777777-7777-7777-7777-777777777005	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
054f292f-49ee-4b31-9ba3-9f4c4d76d684	77777777-7777-7777-7777-777777777005	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
75dc87f2-550e-470a-bd22-9ac5a7f6d36a	77777777-7777-7777-7777-777777777005	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
1956ef58-5978-453e-bd22-9fbb6f61b58a	77777777-7777-7777-7777-777777777005	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
6369f7d8-fa9d-481c-a2c9-eb53a8d63c8e	77777777-7777-7777-7777-777777777006	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	2.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
aa72375d-2d96-47ed-99ff-283e7c268652	77777777-7777-7777-7777-777777777006	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
4480cce8-6d39-416e-afeb-dbd8acde5514	77777777-7777-7777-7777-777777777006	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
73225236-2658-414b-825f-df6810e2d4b3	77777777-7777-7777-7777-777777777006	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
d06d4c6e-d558-46c3-8986-4ae902624b0a	77777777-7777-7777-7777-777777777006	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
25504bf2-3428-4b1b-b4f1-f059e4412112	77777777-7777-7777-7777-777777777006	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
56e7f908-1e9c-433a-bcad-5c0c51389b83	77777777-7777-7777-7777-777777777006	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
8a202792-3855-4dcf-ae22-31568611ce7f	77777777-7777-7777-7777-777777777006	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
449a75dd-6047-4774-bd7a-08fe32c7d03a	77777777-7777-7777-7777-777777777007	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	2.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
3083a382-13b7-4ccf-b134-e4d4af80a0e8	77777777-7777-7777-7777-777777777007	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
46af07c6-1121-4363-9c8e-9062c17fee55	77777777-7777-7777-7777-777777777007	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
00cb36e4-af23-462a-a372-b6a928f9173b	77777777-7777-7777-7777-777777777007	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
611aac98-e572-412e-a8dc-34b0bced5321	77777777-7777-7777-7777-777777777007	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
f3b1721e-e1dd-4225-9a7a-34b27487830c	77777777-7777-7777-7777-777777777007	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
06bed7a1-fde0-4bd4-9d60-e64ab3910cb2	77777777-7777-7777-7777-777777777007	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
b5a31ad9-d0de-4518-8a8f-1cacaf376bfe	77777777-7777-7777-7777-777777777008	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
b25bd1cb-51e0-4379-89e4-2d7f4f216a18	77777777-7777-7777-7777-777777777008	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
c6dc110d-9f3c-4179-a09e-c72be3710975	77777777-7777-7777-7777-777777777008	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
b2709260-c82c-4ecc-8d4f-75a54761214a	77777777-7777-7777-7777-777777777008	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
d09c83e9-735b-46c0-878c-95518c7986d0	77777777-7777-7777-7777-777777777008	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
bd850dff-6909-4f2c-a80a-8baca52a063a	77777777-7777-7777-7777-777777777008	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
1b9143a5-4969-41f4-8c39-aad8bf64a21d	77777777-7777-7777-7777-777777777008	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
0f6383f8-729e-4177-a580-31d639a55ad8	77777777-7777-7777-7777-777777777008	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
8ef2a9bf-aa94-4226-8957-5e4d9f54476f	77777777-7777-7777-7777-777777777009	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
9c49db2f-f44d-400f-9aa2-cee1ce10bbe6	77777777-7777-7777-7777-777777777009	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
0ca252d1-6f1a-4afb-81e9-8cc6c3d1a826	77777777-7777-7777-7777-777777777009	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
9f107161-ae2f-4c1a-8991-5c438136cc63	77777777-7777-7777-7777-777777777009	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
d9f7ee2d-5139-4107-88e5-7d432e6957d3	77777777-7777-7777-7777-777777777009	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
25b27df1-a0e4-459b-8519-f9db35a6664b	77777777-7777-7777-7777-777777777009	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
6da722bf-7680-491c-a9b4-6487e93e7851	77777777-7777-7777-7777-777777777009	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
0bb86f0b-3e26-40b8-a47b-87964c9a6b6d	77777777-7777-7777-7777-777777777009	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
0fed8c64-6428-4327-957a-da68c82aeeda	77777777-7777-7777-7777-777777777010	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
dcb3d530-fb7d-422b-b160-bd7325197c4f	77777777-7777-7777-7777-777777777010	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
ea230f32-194a-4cba-b296-f841abbdabe8	77777777-7777-7777-7777-777777777010	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
b01ce2a8-012d-4ae4-ac1f-73da87848dbc	77777777-7777-7777-7777-777777777010	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
4d230294-ea61-4fe0-b845-88f60316a263	77777777-7777-7777-7777-777777777010	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
13347d19-d22b-49b7-b62b-2150a40070d1	77777777-7777-7777-7777-777777777010	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
6974292b-3dc6-4cec-b4c6-6b4e0fa70580	77777777-7777-7777-7777-777777777010	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
12a3473f-73c9-491d-9b99-6abb31d3afbb	77777777-7777-7777-7777-777777777010	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
2bd63ad8-8ac1-4c78-8fcd-0ba75bd900a1	77777777-7777-7777-7777-777777777005	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	2.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:22:11.101802+05:30
dd538911-5fce-4ed4-8078-1db0bd29503d	de751bd0-7050-436f-b5ac-253242ceaf20	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	0.0	0.0	0.0	2026-06-11 14:51:07.036097+05:30	2026-06-11 14:51:07.036097+05:30
a931957f-929e-4abc-b46d-b6b7d41ac217	de751bd0-7050-436f-b5ac-253242ceaf20	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-11 14:51:07.036097+05:30	2026-06-11 14:51:07.036097+05:30
30a424f8-c87e-4b3a-8513-55a5b2691576	de751bd0-7050-436f-b5ac-253242ceaf20	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-11 14:51:07.036097+05:30	2026-06-11 14:51:07.036097+05:30
6acc6695-f681-44e9-a989-541b16dad187	de751bd0-7050-436f-b5ac-253242ceaf20	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-11 14:51:07.036097+05:30	2026-06-11 14:51:07.036097+05:30
9900ccca-8238-4b3c-bd36-a0291175d5d7	de751bd0-7050-436f-b5ac-253242ceaf20	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-11 14:51:07.036097+05:30	2026-06-11 14:51:07.036097+05:30
ce71e5a7-5bba-45e3-bd25-20153c5d85f7	de751bd0-7050-436f-b5ac-253242ceaf20	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-11 14:51:07.036097+05:30	2026-06-11 14:51:07.036097+05:30
e50a1f32-f912-4003-b876-73bd971330de	de751bd0-7050-436f-b5ac-253242ceaf20	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-11 14:51:07.036097+05:30	2026-06-11 14:51:07.036097+05:30
5a965fb5-d5d6-4ce4-a4ad-436dbef92766	de751bd0-7050-436f-b5ac-253242ceaf20	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-11 14:51:07.036097+05:30	2026-06-11 14:51:07.036097+05:30
6b098f0f-23d2-4f90-a4ce-17440760a389	77777777-7777-7777-7777-777777777007	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	3.0	0.0	0.0	2026-06-11 03:18:16.72728+05:30	2026-06-11 16:36:06.423024+05:30
1bc18066-2986-4aba-80c9-40e823940825	c4252c1f-5026-48a4-8595-c87c1e9f799d	9804a195-ac58-48e2-8246-0d03e64586c4	2026	12.0	0.0	0.0	0.0	2026-06-11 16:53:19.105322+05:30	2026-06-11 16:53:19.105322+05:30
1330fb20-3f8c-4c25-a2c8-16022f457b40	c4252c1f-5026-48a4-8595-c87c1e9f799d	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026	10.0	0.0	0.0	0.0	2026-06-11 16:53:19.105322+05:30	2026-06-11 16:53:19.105322+05:30
6968287b-80c6-464c-8ae2-aaeaea4bb374	c4252c1f-5026-48a4-8595-c87c1e9f799d	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026	15.0	0.0	0.0	0.0	2026-06-11 16:53:19.105322+05:30	2026-06-11 16:53:19.105322+05:30
e2841a97-f6e1-4087-91b6-cf91c8b223a4	c4252c1f-5026-48a4-8595-c87c1e9f799d	71e17a24-c308-46e2-aed4-56b5a4930769	2026	30.0	0.0	0.0	0.0	2026-06-11 16:53:19.105322+05:30	2026-06-11 16:53:19.105322+05:30
8a55f055-9ac9-4ea5-8750-285bc3b45fa6	c4252c1f-5026-48a4-8595-c87c1e9f799d	f4b31609-0408-4431-993c-35d52cce69c3	2026	3.0	0.0	0.0	0.0	2026-06-11 16:53:19.105322+05:30	2026-06-11 16:53:19.105322+05:30
64955dc9-764d-4b88-9bff-f71288ff6752	c4252c1f-5026-48a4-8595-c87c1e9f799d	7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	2026	182.0	0.0	0.0	0.0	2026-06-11 16:53:19.105322+05:30	2026-06-11 16:53:19.105322+05:30
118cfbfc-905a-428e-8591-2ddcb9935543	c4252c1f-5026-48a4-8595-c87c1e9f799d	ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	2026	15.0	0.0	0.0	0.0	2026-06-11 16:53:19.105322+05:30	2026-06-11 16:53:19.105322+05:30
2132a733-8290-4514-b2cf-00b7568c3d28	c4252c1f-5026-48a4-8595-c87c1e9f799d	52d845dd-9b8f-498d-b57f-26a07cd8697a	2026	5.0	0.0	0.0	0.0	2026-06-11 16:53:19.105322+05:30	2026-06-11 16:53:19.105322+05:30
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_requests (id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, attachment_url, is_half_day, half_day_type, applied_at, cancelled_at, cancelled_by, cancellation_reason, created_at, updated_at) FROM stdin;
b39e4c96-3232-4e5d-9ac5-cffa0b3c5182	f86516e6-a1b5-4ffb-b46e-f6c5c7154cd4	9804a195-ac58-48e2-8246-0d03e64586c4	2026-06-10	2026-06-13	3.0	suffering from success	cancelled	\N	f	\N	2026-06-10 20:06:01.177868+05:30	2026-06-10 20:06:18.000805+05:30	ec77b8f8-3848-4b3e-ab61-e733a21c432c	\N	2026-06-10 20:06:01.177868+05:30	2026-06-10 20:06:18.000805+05:30
4ac4d9b7-0082-4f37-9039-70805de4abd4	f86516e6-a1b5-4ffb-b46e-f6c5c7154cd4	1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	2026-06-13	2026-06-16	2.0	asfkjsdlvpnsa	approved	\N	f	\N	2026-06-10 20:29:27.046034+05:30	\N	\N	\N	2026-06-10 20:29:27.046034+05:30	2026-06-10 20:30:26.406232+05:30
88888888-8888-8888-8888-888888888001	77777777-7777-7777-7777-777777777004	9804a195-ac58-48e2-8246-0d03e64586c4	2026-06-01	2026-06-03	3.0	Family function	approved	\N	f	\N	2026-06-11 03:18:16.72728+05:30	\N	\N	\N	2026-05-25 00:00:00+05:30	2026-06-11 03:18:16.72728+05:30
88888888-8888-8888-8888-888888888003	77777777-7777-7777-7777-777777777006	9804a195-ac58-48e2-8246-0d03e64586c4	2026-05-20	2026-05-21	2.0	Personal work	approved	\N	f	\N	2026-06-11 03:18:16.72728+05:30	\N	\N	\N	2026-05-15 00:00:00+05:30	2026-06-11 03:18:16.72728+05:30
88888888-8888-8888-8888-888888888005	77777777-7777-7777-7777-777777777008	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026-06-18	2026-06-20	3.0	Medical	rejected	\N	f	\N	2026-06-11 03:18:16.72728+05:30	\N	\N	\N	2026-06-07 00:00:00+05:30	2026-06-11 03:18:16.72728+05:30
88888888-8888-8888-8888-888888888002	77777777-7777-7777-7777-777777777005	6a6fef3e-9d81-4a76-8a00-de51d30242f0	2026-06-10	2026-06-11	2.0	Fever	approved	\N	f	\N	2026-06-11 03:18:16.72728+05:30	\N	\N	\N	2026-06-08 00:00:00+05:30	2026-06-11 03:22:11.101802+05:30
88888888-8888-8888-8888-888888888004	77777777-7777-7777-7777-777777777007	9804a195-ac58-48e2-8246-0d03e64586c4	2026-06-15	2026-06-17	3.0	Travel	approved	\N	f	\N	2026-06-11 03:18:16.72728+05:30	\N	\N	\N	2026-06-09 00:00:00+05:30	2026-06-11 16:36:06.423024+05:30
\.


--
-- Data for Name: leave_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_types (id, name, code, description, color, max_days_per_year, max_consecutive_days, carry_forward, max_carry_forward_days, requires_attachment, requires_approval, applicable_gender, min_service_months, is_paid, is_active, created_at, updated_at) FROM stdin;
9804a195-ac58-48e2-8246-0d03e64586c4	Casual Leave	CL	For personal reasons and casual absences	#4F46E5	12	\N	f	0	f	t	\N	0	t	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
6a6fef3e-9d81-4a76-8a00-de51d30242f0	Sick Leave	SL	For medical and health reasons	#DC2626	10	\N	f	0	f	t	\N	0	t	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
1918f399-69ab-4ab7-8d9a-a22aa8e5e87f	Paid Leave	PL	Annual paid vacation leave	#059669	15	\N	t	5	f	t	\N	0	t	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
71e17a24-c308-46e2-aed4-56b5a4930769	Unpaid Leave	UL	Leave without pay	#6B7280	30	\N	f	0	f	t	\N	0	f	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
f4b31609-0408-4431-993c-35d52cce69c3	Emergency Leave	EL	For urgent family or personal emergencies	#D97706	3	\N	f	0	f	t	\N	0	t	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
7b1c55f4-c01e-4de5-a427-5110c4d6a3cb	Maternity Leave	ML	Maternity leave for new mothers	#7C3AED	182	\N	f	0	f	t	\N	0	t	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
ac61b8cf-d102-48e7-92e8-dd6c8d76cf5d	Paternity Leave	PTL	Paternity leave for new fathers	#0047AB	15	\N	f	0	f	t	\N	0	t	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
52d845dd-9b8f-498d-b57f-26a07cd8697a	Bereavement Leave	BL	Leave due to death in family	#374151	5	\N	f	0	f	t	\N	0	t	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, data, is_read, read_at, action_url, created_at) FROM stdin;
33b391f6-4586-47e2-be99-ae6c27c913ff	66666666-6666-6666-6666-666666666007	leave_approved	Leave Request Approved	Your leave request for Casual Leave has been approved.	{"leaveId": "88888888-8888-8888-8888-888888888004"}	f	\N	/leaves	2026-06-11 16:36:06.473804+05:30
49fd7bbe-0767-4c40-a36c-e070ab5ab9bf	66666666-6666-6666-6666-666666666010	new_employee	New Team Member	Arvind Srinivasan has joined the Finance department as Chief Finance Officer.	{"employeeId": "c4252c1f-5026-48a4-8595-c87c1e9f799d"}	f	\N	/employees/c4252c1f-5026-48a4-8595-c87c1e9f799d	2026-06-11 16:53:19.453208+05:30
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, user_id, token_hash, expires_at, is_revoked, ip_address, user_agent, created_at) FROM stdin;
70364faa-5690-4da9-b1c4-df8159cc868f	c1b54692-fb97-46b0-a467-c9f3ca098c22	feffa37425fc662a4fbb27899d807cff4b997f816caf35c175615cfbd2ecc5ba	2026-06-17 18:41:39.63742+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 18:41:39.63742+05:30
6509c471-fef5-4436-a4db-522192d18892	c1b54692-fb97-46b0-a467-c9f3ca098c22	95089596c9bd8dab28bd3c02e0e05f004f3cf364280ff6d0b1b89357593294c3	2026-06-17 18:44:50.134107+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 18:44:50.134107+05:30
b937abf6-9830-4fda-9752-0f93304c7a5e	c1b54692-fb97-46b0-a467-c9f3ca098c22	2531be2fac4af5b14959f6aa2e770bc7e836b186ddf73f54eadaa7f5dc15fa97	2026-06-17 19:48:09.812839+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 19:48:09.812839+05:30
29650c52-f522-45c8-b4d4-6200c6c77412	c1b54692-fb97-46b0-a467-c9f3ca098c22	9be91db480d288aaa37bbd780679b381f3f71da22e3595ec93e606b6b41311dc	2026-06-17 19:53:33.151764+05:30	f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 19:53:33.151764+05:30
c728d585-7c3d-457a-bf7e-7df1668f34c4	c1b54692-fb97-46b0-a467-c9f3ca098c22	4fabdf9a9304c851ccaef384e22f2b04396e5909a90fb62f1e5ba155ef244232	2026-06-17 20:01:02.270257+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:01:02.270257+05:30
01c8d946-e9d5-4d41-a432-525db6ed01ce	ec77b8f8-3848-4b3e-ab61-e733a21c432c	c62d1b775721c4f0ee939615125ced6fd9e967b31f3565d3cac0439bf14d1e33	2026-06-17 20:03:23.748788+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:03:23.748788+05:30
3e46e31f-51f4-45f0-98e2-f17f00919e8a	ec77b8f8-3848-4b3e-ab61-e733a21c432c	6f5d5ca41c1555bf02f2d666a435f2e043d9d34ea40b162a839ac7b4e0296342	2026-06-17 20:23:11.66483+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:23:11.66483+05:30
fa17cfa5-a03d-4619-bb5a-6bef553bf9a4	c1b54692-fb97-46b0-a467-c9f3ca098c22	7b18eee564bc343ffe1955af2bb1f040331c5a87e7c470522cca50377ae6da53	2026-06-17 20:30:04.293718+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:30:04.293718+05:30
d130f50d-c843-4309-bbdc-6226c9672c1e	c1b54692-fb97-46b0-a467-c9f3ca098c22	6a6dea5d1b5cc64aae5f7db091a9cc90bdfa439179acfed79092b31bd713b559	2026-06-17 20:51:27.269141+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 20:51:27.269141+05:30
04478dcd-d83b-474c-b264-a1a406c1c998	c1b54692-fb97-46b0-a467-c9f3ca098c22	33b84a5a33d67e922721a467b8ff5e69f76ca4b867f72d166aa9b1248fa04920	2026-06-17 21:14:46.665525+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 21:14:46.665525+05:30
c79258df-4a8e-493a-a32b-f4606cf5f229	c1b54692-fb97-46b0-a467-c9f3ca098c22	6b2f277e76cdc3fe16568d3672bed7702ef98cbae2a88d47a4a0d6b37d1d88eb	2026-06-17 21:53:06.778866+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 21:53:06.778866+05:30
aa339e4d-e215-4992-90a6-6afdbba7099a	c1b54692-fb97-46b0-a467-c9f3ca098c22	632d17c163343193195f7f7b6f184da5dc13387f57b0027394f6772dafa99348	2026-06-17 22:22:15.88064+05:30	f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 22:22:15.88064+05:30
4f10945b-28ce-402f-a70c-cb8420585056	c1b54692-fb97-46b0-a467-c9f3ca098c22	4564ad9d0aec2a78d41b24aa6321e853dd9d7a9e0cca5420661d07f4910d0d6c	2026-06-17 22:22:41.93184+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-10 22:22:41.93184+05:30
57fd4df6-bb5f-4454-8dac-4149f2a4289d	c1b54692-fb97-46b0-a467-c9f3ca098c22	aa87d9c9601e345d83ce4d9097c32aad5b084c7e9de183f5380e07ce8af8532b	2026-06-18 00:03:53.684731+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 00:03:53.684731+05:30
55a600f3-7daa-431e-be2c-b3930e6c63d9	c1b54692-fb97-46b0-a467-c9f3ca098c22	43f20f905115bc40843da27fc6edeb60e89f33470a4f7b804a424c5f21932841	2026-06-18 01:35:25.255721+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 01:35:25.255721+05:30
265f9713-11b6-429a-a000-7119f55e4013	c1b54692-fb97-46b0-a467-c9f3ca098c22	1a28c675d045695797ce8df9a7225a6ad24d3d62a9fbaf0285e1bdeee836545a	2026-06-18 02:32:12.352596+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 02:32:12.352596+05:30
eb66dae6-38f2-42df-97f4-a4aed549d3a5	c1b54692-fb97-46b0-a467-c9f3ca098c22	07bf9b16b70b97a17f6722f107e2f50ec41f05c76ded07b9b12ac855897cfd58	2026-06-18 03:01:07.278051+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 03:01:07.278051+05:30
f5dc1b6d-d806-4c70-8317-a93723cf5e00	c1b54692-fb97-46b0-a467-c9f3ca098c22	0ed8c31caf0dd6d30e88e721eff8f4276036bca2402d1314c730727e0d53106d	2026-06-18 03:21:26.469511+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 03:21:26.469511+05:30
6e4dc3e4-cbd0-482e-a4bc-65d4b4e59bbb	c1b54692-fb97-46b0-a467-c9f3ca098c22	3db33782576bd5c1559be100e6d9ada2e481b4ac63f875c74954abe5208f3c14	2026-06-18 03:43:20.881897+05:30	f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 03:43:20.881897+05:30
5890db89-61b0-4e1d-b706-208c085a33ec	972853fe-2973-4500-a589-a92e1b1c5f84	b45b42c9763f8c5059d5ed0a4253a40f15ff5344b6e3d65328dcbcecefaf525b	2026-06-18 03:43:47.966373+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 03:43:47.966373+05:30
07ca476d-5f6d-4f8c-a6d7-23ad30dd0ed4	992a2f21-88a5-46ab-ac8f-1517251ff6f5	46fda89c28b851752af791f4ee54b244e5f3c9aa204c1100725dad24472c3dd1	2026-06-18 12:38:35.465168+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 12:38:35.465168+05:30
6d56b1d0-04b0-4f0c-ab53-568c2c89b119	992a2f21-88a5-46ab-ac8f-1517251ff6f5	60b09142ee9d89322f8e21a80d5aea17932b3907414c999be93fe968c2c4af8d	2026-06-18 12:47:04.818322+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 12:47:04.818322+05:30
28766f87-fb91-46ec-ad80-9947a0571d43	992a2f21-88a5-46ab-ac8f-1517251ff6f5	d7d11d2b97d328cf5ff46f9d9067a4c2dcda0f66a3b32af8501e0f28b0a59a33	2026-06-18 13:18:39.101005+05:30	f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 13:18:39.101005+05:30
e5090180-e88c-4501-82b8-7d733075dba6	992a2f21-88a5-46ab-ac8f-1517251ff6f5	af43b80156518bf39a88ec03f27ffcda683337fdbb7881ecf291b0c24d52bd6a	2026-06-18 13:28:33.819288+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 13:28:33.819288+05:30
c01f05c0-d9e1-46ac-8dec-fac42081e5c2	992a2f21-88a5-46ab-ac8f-1517251ff6f5	9c1425a86ab56d97865000f6906a7671d0934635cbd42a2b5c4d1bbec42fccba	2026-06-18 13:56:12.820394+05:30	t	::1	Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 CrKey/1.54.250320	2026-06-11 13:56:12.820394+05:30
e026aa46-bf49-4362-a866-ed8d3182ca42	992a2f21-88a5-46ab-ac8f-1517251ff6f5	fb986251d528e8511254204c085b9e7fb719e8187590f9a0eb658035dfa182ff	2026-06-18 14:06:58.057288+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 14:06:58.057288+05:30
77fc05ce-dfa5-418a-9fbc-bad7fd38f0e5	992a2f21-88a5-46ab-ac8f-1517251ff6f5	fb88036383079271bc2b5844fff33b32ee4d489c35e3be63239f66b4b9233871	2026-06-18 14:16:20.094573+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 14:16:20.094573+05:30
03b85af0-c905-4f99-83e3-cbb82077e4ba	992a2f21-88a5-46ab-ac8f-1517251ff6f5	c05eb24cc4073b1d856c03f5c100839b17bbbd34ceb27016e92b604311781447	2026-06-18 14:34:30.478295+05:30	f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 14:34:30.478295+05:30
5b6a5ef3-d52a-4ad0-b381-c0b3a26d7f3f	66666666-6666-6666-6666-666666666001	be9fc7f67d3a32cf4eb7a0e30b2779467a12824a40e49c2b0b5cf58cf6ff82f2	2026-06-18 14:43:19.494938+05:30	f	::1	\N	2026-06-11 14:43:19.494938+05:30
7fb5b8f3-7948-4ec4-a3cf-d217e9476422	66666666-6666-6666-6666-666666666001	6aa4826051f5e0154e1a0a5cce3f18ffc27625755f7e296686b7a1a59620eac7	2026-06-18 14:45:08.004598+05:30	f	::1	\N	2026-06-11 14:45:08.004598+05:30
26afb48e-c3a0-413b-a369-dfb1e82fdfaf	992a2f21-88a5-46ab-ac8f-1517251ff6f5	dacc528b47714acc53a74899e2bdebb7b9e95d9fce1eb286e0bd73b9ea8949e4	2026-06-18 14:37:37.201601+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 14:37:37.201601+05:30
bdecad3a-e343-4413-b3f5-a4c12f4d778e	992a2f21-88a5-46ab-ac8f-1517251ff6f5	01d2e0a239198e0ee12c3add5f7da21e6051c686b135aba792a48315e9077510	2026-06-18 14:53:06.400432+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 14:53:06.400432+05:30
cba0993c-c6ed-4810-a6b2-7543adcc74dc	992a2f21-88a5-46ab-ac8f-1517251ff6f5	fb8c4937ef9942e0647c993e8ec6b8d330cba7441f3d2d8e75986086e581b895	2026-06-18 15:10:46.496505+05:30	f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 15:10:46.496505+05:30
4d8c4a92-a721-42f0-b2ab-705ea19fcac7	992a2f21-88a5-46ab-ac8f-1517251ff6f5	2ba08d26f34dfc40764198c1c47c141dd43ba541b20d5ca47c7cd6f3494ae123	2026-06-18 15:34:48.314624+05:30	f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 15:34:48.314624+05:30
a5bd95db-fe0c-491c-b9d4-65db5a150650	66666666-6666-6666-6666-666666666001	7cf4bab836dd070dc0522ca6025326f8e320727b5587e3b11af8a3d19330edc7	2026-06-18 15:39:17.263285+05:30	f	::1	\N	2026-06-11 15:39:17.263285+05:30
1e3af280-b923-40cf-8e62-eda1ff83c5bb	992a2f21-88a5-46ab-ac8f-1517251ff6f5	789e318c2c24508b33071d5fb3e3eba9cf80a3e160bab6cfb99050544a431f52	2026-06-18 15:51:19.702069+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 15:51:19.702069+05:30
f8f9f0d8-d764-4514-9cb7-e87b47d39f4a	992a2f21-88a5-46ab-ac8f-1517251ff6f5	3fc6b5c9f5a2b910eda9311f0b32b0b02ed8cd0729e6b07c86289b4763e63eed	2026-06-18 16:02:53.731803+05:30	f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 16:02:53.731803+05:30
31d80310-e7a2-4978-a8f7-ecd2cef45600	992a2f21-88a5-46ab-ac8f-1517251ff6f5	6a5b5410de67cade4c00d01139349af6595baefd67774077d22429260f002677	2026-06-18 16:20:09.595893+05:30	f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 16:20:09.595893+05:30
ceda4836-23e6-4b18-965b-3d37cb3b8d8f	992a2f21-88a5-46ab-ac8f-1517251ff6f5	57112829a1378ff6aeb31936b95cd9969c4fb27f7da43c2c7bdcc7116cd37b98	2026-06-18 16:35:36.332158+05:30	f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 16:35:36.332158+05:30
9636d900-9434-447e-996a-e5810fc01b99	992a2f21-88a5-46ab-ac8f-1517251ff6f5	5207428287315c9b0df71402ce7f096adf2679ca922338d7dc4f878fa84a16a3	2026-06-18 16:50:03.042158+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 16:50:03.042158+05:30
f763c666-0639-4ef0-b9f7-1be34b0ac20f	992a2f21-88a5-46ab-ac8f-1517251ff6f5	8d1c50b291fec9f08c86cb6265ccf22238e16c0ce6e8d4058d7d4443ffa79bcf	2026-06-18 17:17:08.045732+05:30	t	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 17:17:08.045732+05:30
f396a6c8-a187-475a-822d-a1b94aa9ec44	992a2f21-88a5-46ab-ac8f-1517251ff6f5	ae4936541bccecfb35687c50a8dd9e40f25084267516f8ae8806ef78f727cff4	2026-06-18 17:24:29.458999+05:30	f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-11 17:24:29.458999+05:30
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, permissions, created_at, updated_at) FROM stdin;
1	admin	System Administrator	["all"]	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
2	hr	Human Resources Manager	["employees:all", "leaves:all", "departments:all", "skills:all", "reports:view"]	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
3	manager	Team Manager	["employees:view", "leaves:approve", "team:manage"]	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
4	employee	Regular Employee	["leaves:apply", "profile:edit", "documents:upload"]	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
\.


--
-- Data for Name: skill_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skill_categories (id, name, description, color, icon, is_active, created_at) FROM stdin;
11111111-1111-1111-1111-111111111001	Technical	Programming languages, frameworks, tools	#4F46E5	\N	t	2026-06-10 16:43:38.12592+05:30
11111111-1111-1111-1111-111111111002	Soft Skills	Communication, leadership, teamwork	#7C3AED	\N	t	2026-06-10 16:43:38.12592+05:30
11111111-1111-1111-1111-111111111003	Management	Project management, team leadership	#0047AB	\N	t	2026-06-10 16:43:38.12592+05:30
11111111-1111-1111-1111-111111111004	Domain Knowledge	Industry-specific knowledge	#059669	\N	t	2026-06-10 16:43:38.12592+05:30
\.


--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skills (id, name, category_id, description, is_active, created_at, updated_at) FROM stdin;
f7c1c6e4-7c6a-4b04-a79e-254fcb2d3731	JavaScript	11111111-1111-1111-1111-111111111001	JavaScript programming language	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
f1ea647e-7dfb-4ef0-80e1-edb5ba32b40c	TypeScript	11111111-1111-1111-1111-111111111001	TypeScript superset of JavaScript	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
2ef222ac-e7ba-446f-a6e6-35e5657651db	React.js	11111111-1111-1111-1111-111111111001	React frontend framework	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
c1c30e11-2485-4054-a4b6-90952308c232	Node.js	11111111-1111-1111-1111-111111111001	Node.js runtime environment	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
a5a976ff-5228-4d36-bed5-b1076d8181db	Python	11111111-1111-1111-1111-111111111001	Python programming language	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
65f346b8-b3da-4c34-8015-0168433912cd	PostgreSQL	11111111-1111-1111-1111-111111111001	PostgreSQL database	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
dddfdb8e-8bc7-4afd-af3a-885a038b45c1	MongoDB	11111111-1111-1111-1111-111111111001	MongoDB NoSQL database	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
cc2484b9-6555-448e-95b8-7dad347821ea	Docker	11111111-1111-1111-1111-111111111001	Docker containerization	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
882d4f84-222f-4935-b730-f32eac2b0f7e	AWS	11111111-1111-1111-1111-111111111001	Amazon Web Services	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
182ba4f5-47cb-45b3-9a45-f64d50f0db02	Communication	11111111-1111-1111-1111-111111111002	Verbal and written communication	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
9c835835-5b75-44f5-9b4f-5e6d89b0ff94	Leadership	11111111-1111-1111-1111-111111111002	Team leadership and mentoring	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
0a1a91a3-b356-45bf-9f21-f440a0c9be19	Problem Solving	11111111-1111-1111-1111-111111111002	Analytical and creative problem solving	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
2a938e15-c35a-4b01-8223-799cb65999de	Project Management	11111111-1111-1111-1111-111111111003	Project planning and execution	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
272634b1-41ea-4b4d-9416-f4ac92b97436	Agile/Scrum	11111111-1111-1111-1111-111111111003	Agile methodologies and Scrum	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
b3c0e47e-507a-464b-a89e-3c40bf94f53d	Data Analysis	11111111-1111-1111-1111-111111111004	Business data analysis	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
4d223e44-6094-4783-a02a-3cee3aaa791e	Machine Learning	11111111-1111-1111-1111-111111111001	ML algorithms and frameworks	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
86369932-8113-429a-90dc-33af47cfdab4	UI/UX Design	11111111-1111-1111-1111-111111111001	User interface and experience design	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
a33babe3-5fee-4c2a-a2d5-c6511e5f151b	DevOps	11111111-1111-1111-1111-111111111001	Development operations and CI/CD	t	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30
9af1958e-9804-4f7c-8efa-d069e6e87d61	Data mining	11111111-1111-1111-1111-111111111004		f	2026-06-10 19:51:00.504151+05:30	2026-06-10 19:52:07.324178+05:30
27e9471c-34de-426d-9081-61ed8c33059e	React	11111111-1111-1111-1111-111111111001	React frontend development	t	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
3a3c7f34-116e-4699-98f3-0a384b37c3f1	NodeJS	11111111-1111-1111-1111-111111111001	Node.js backend development	t	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
ddae1e2a-8c26-4afc-9938-8b81518ab73b	HTML	11111111-1111-1111-1111-111111111001	Semantic HTML	t	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
183c2670-15b1-4900-bce9-ea06bc025f35	CSS	11111111-1111-1111-1111-111111111001	Responsive CSS	t	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
1e52aea4-0146-43fe-b8a3-e20762c31324	Testing	11111111-1111-1111-1111-111111111001	Manual and automated testing	t	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
6aee422d-6cb6-4dd9-b95c-508bb6286072	Salesforce	11111111-1111-1111-1111-111111111004	Salesforce CRM	t	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30
9c4302ca-7ab6-4247-8db1-4953c3d1fd3d	Man Management	11111111-1111-1111-1111-111111111002	\N	t	2026-06-11 14:21:52.766051+05:30	2026-06-11 14:21:52.766051+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, role_id, is_active, is_email_verified, last_login, failed_login_attempts, locked_until, created_at, updated_at, deleted_at) FROM stdin;
33333333-3333-3333-3333-333333333002	hr@peopleflow.io	$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	2	t	t	\N	0	\N	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30	\N
33333333-3333-3333-3333-333333333003	manager@peopleflow.io	$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	3	t	t	\N	0	\N	2026-06-10 16:43:38.12592+05:30	2026-06-10 16:43:38.12592+05:30	\N
33333333-3333-3333-3333-333333333001	admin@peopleflow.io	$2a$12$JIgxQ0r2T5k0EKtG4aWrGOw3UxQI1UT3.O36gjmwX4zwYqq53zFRO	1	t	t	\N	0	\N	2026-06-10 16:43:38.12592+05:30	2026-06-10 17:32:16.233105+05:30	\N
66666666-6666-6666-6666-666666666001	pranay@isoftzone.com	$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm	1	t	t	2026-06-11 15:39:17.273153+05:30	0	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 15:39:17.273153+05:30	\N
ec77b8f8-3848-4b3e-ab61-e733a21c432c	johnthedon@wwe.com	$2a$12$sCxBHq9Z5STyH75Tlc09FOf3hJJY1ksmiTeZoAYR27HgS8O/pOx6m	4	t	f	2026-06-10 20:03:23.757922+05:30	0	\N	2026-06-10 20:02:57.892617+05:30	2026-06-10 20:03:23.757922+05:30	\N
c1b54692-fb97-46b0-a467-c9f3ca098c22	krsnaa134@gmail.com	$2a$12$6LHjd9hYGH8LzdlwaMI4XeZbxq.e4QjQPvj7EVZdTzzn6QeU04pUK	1	t	f	2026-06-10 22:22:42.004221+05:30	0	\N	2026-06-10 18:35:24.550662+05:30	2026-06-10 22:22:42.004221+05:30	\N
66666666-6666-6666-6666-666666666002	rahul@isoftzone.com	$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm	3	t	t	\N	0	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
66666666-6666-6666-6666-666666666003	priya@isoftzone.com	$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm	2	t	t	\N	0	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
66666666-6666-6666-6666-666666666004	amit@isoftzone.com	$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm	4	t	t	\N	0	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
66666666-6666-6666-6666-666666666005	neha@isoftzone.com	$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm	4	t	t	\N	0	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
66666666-6666-6666-6666-666666666006	rohit@isoftzone.com	$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm	4	t	t	\N	0	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
66666666-6666-6666-6666-666666666007	anjali@isoftzone.com	$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm	4	t	t	\N	0	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
66666666-6666-6666-6666-666666666008	vikas@isoftzone.com	$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm	4	t	t	\N	0	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
66666666-6666-6666-6666-666666666009	pooja@isoftzone.com	$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm	4	t	t	\N	0	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
66666666-6666-6666-6666-666666666010	sandeep@isoftzone.com	$2a$12$b8Y5pEwzT6GelEVwwE5kMOiMlNgIJReSaGawcYNE/Nabl9cmuJnWm	4	t	t	\N	0	\N	2026-06-11 03:18:16.72728+05:30	2026-06-11 03:18:16.72728+05:30	\N
972853fe-2973-4500-a589-a92e1b1c5f84	kishankantt2007@gmail.com	$2a$12$1Wv/7ZKVg9By/2hWlJGtYuNPp4kEK/XKDgaPOwZqp1ixiqjJOQeIC	4	t	t	2026-06-11 03:43:47.978583+05:30	0	\N	2026-06-11 03:30:38.110092+05:30	2026-06-11 03:43:47.978583+05:30	\N
6c2557fa-80e3-47f1-8790-6dc4c96266c8	user-31316342@example.com	$2a$12$OXon49xf4dFEpvoMre4AuOh3YAE2ABLVYFOyKFPgkL4Fz0V4od0MS	4	t	f	\N	0	\N	2026-06-11 04:02:43.073389+05:30	2026-06-11 04:02:43.073389+05:30	\N
66e8a748-2e72-4f59-92ed-30bddfc94754	ravikantsumeru@gmail.com	$2a$12$h3IkLzrvFUhSbkXspPbpCeRvFsJnKo9k.O3eDCr87oCTFOcab9bwW	4	t	f	\N	0	\N	2026-06-11 04:07:03.799146+05:30	2026-06-11 04:07:03.799146+05:30	\N
dd3c88e8-40e4-4231-9170-a5c867e783e3	krsnaa135@gmail.com	$2a$12$zE5ukqt1u9TROGn9yVsiKO/1c3xcGn3bqlAejC9HrDTkbxMPm3Sz.	4	t	t	\N	0	\N	2026-06-11 04:25:47.14449+05:30	2026-06-11 04:27:21.310064+05:30	\N
63ac5f49-c951-4493-a1d2-a181f761ff80	atikshmmishra@gmail.com	$2a$12$I2.AjlXDREKX80SbsSRYduptd8NcGBUQMtpbsQ7CaFlg0Fyfajzpi	4	t	f	\N	0	\N	2026-06-11 12:24:52.1012+05:30	2026-06-11 12:24:52.1012+05:30	\N
992a2f21-88a5-46ab-ac8f-1517251ff6f5	mailtokrishnawork@gmail.com	$2a$12$3SLZhJd/a591rTvZ0OgzO.iWqReMHJnXdmXCcdVg3nw1g7gybTYb.	2	t	t	2026-06-11 17:24:29.505182+05:30	0	\N	2026-06-11 12:37:57.883031+05:30	2026-06-11 17:24:29.505182+05:30	\N
\.


--
-- Name: _migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public._migrations_id_seq', 3, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: _migrations _migrations_filename_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_filename_key UNIQUE (filename);


--
-- Name: _migrations _migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: employee_skills employee_skills_employee_id_skill_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_skills
    ADD CONSTRAINT employee_skills_employee_id_skill_id_key UNIQUE (employee_id, skill_id);


--
-- Name: employee_skills employee_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_skills
    ADD CONSTRAINT employee_skills_pkey PRIMARY KEY (id);


--
-- Name: employee_timeline employee_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_timeline
    ADD CONSTRAINT employee_timeline_pkey PRIMARY KEY (id);


--
-- Name: employees employees_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_code_key UNIQUE (employee_code);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: employees employees_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_key UNIQUE (user_id);


--
-- Name: leave_approvals leave_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_approvals
    ADD CONSTRAINT leave_approvals_pkey PRIMARY KEY (id);


--
-- Name: leave_balances leave_balances_employee_id_leave_type_id_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_leave_type_id_year_key UNIQUE (employee_id, leave_type_id, year);


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: leave_types leave_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_code_key UNIQUE (code);


--
-- Name: leave_types leave_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_name_key UNIQUE (name);


--
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: skill_categories skill_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_name_key UNIQUE (name);


--
-- Name: skill_categories skill_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_pkey PRIMARY KEY (id);


--
-- Name: skills skills_name_category_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_name_category_id_key UNIQUE (name, category_id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);


--
-- Name: idx_documents_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_employee ON public.documents USING btree (employee_id);


--
-- Name: idx_email_verification_tokens_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_verification_tokens_hash ON public.email_verification_tokens USING btree (token_hash);


--
-- Name: idx_email_verification_tokens_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_verification_tokens_user ON public.email_verification_tokens USING btree (user_id);


--
-- Name: idx_employee_skills_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_skills_employee ON public.employee_skills USING btree (employee_id);


--
-- Name: idx_employee_timeline_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_timeline_employee ON public.employee_timeline USING btree (employee_id);


--
-- Name: idx_employees_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_code ON public.employees USING btree (employee_code);


--
-- Name: idx_employees_dept; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_dept ON public.employees USING btree (department_id);


--
-- Name: idx_employees_manager; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_manager ON public.employees USING btree (manager_id);


--
-- Name: idx_employees_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_name ON public.employees USING gin (to_tsvector('english'::regconfig, (((first_name)::text || ' '::text) || (last_name)::text)));


--
-- Name: idx_employees_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_status ON public.employees USING btree (employment_status);


--
-- Name: idx_employees_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_user ON public.employees USING btree (user_id);


--
-- Name: idx_leave_balances_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_balances_employee ON public.leave_balances USING btree (employee_id, year);


--
-- Name: idx_leave_requests_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_dates ON public.leave_requests USING btree (start_date, end_date);


--
-- Name: idx_leave_requests_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_employee ON public.leave_requests USING btree (employee_id);


--
-- Name: idx_leave_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_status ON public.leave_requests USING btree (status);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_refresh_tokens_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role_id);


--
-- Name: departments update_departments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: employees update_employees_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leave_balances update_leave_balances_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON public.leave_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leave_requests update_leave_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: skills update_skills_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON public.skills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: departments departments_parent_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_department_id_fkey FOREIGN KEY (parent_department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: documents documents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: documents documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: documents documents_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: employee_skills employee_skills_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_skills
    ADD CONSTRAINT employee_skills_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_skills employee_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_skills
    ADD CONSTRAINT employee_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: employee_timeline employee_timeline_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_timeline
    ADD CONSTRAINT employee_timeline_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_timeline employee_timeline_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_timeline
    ADD CONSTRAINT employee_timeline_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id);


--
-- Name: employees employees_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: employees employees_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: departments fk_dept_head; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: leave_approvals leave_approvals_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_approvals
    ADD CONSTRAINT leave_approvals_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: leave_approvals leave_approvals_leave_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_approvals
    ADD CONSTRAINT leave_approvals_leave_request_id_fkey FOREIGN KEY (leave_request_id) REFERENCES public.leave_requests(id) ON DELETE CASCADE;


--
-- Name: leave_balances leave_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: leave_balances leave_balances_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id) ON DELETE CASCADE;


--
-- Name: leave_requests leave_requests_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(id);


--
-- Name: leave_requests leave_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: leave_requests leave_requests_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: skills skills_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.skill_categories(id) ON DELETE SET NULL;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict ewO7znktAKWDadGSexglzH6CitNjECqBwUFuj2Dy8SPbreleGBtSLjOUV1Q2cWO

