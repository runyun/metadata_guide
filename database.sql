-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.affiliation (
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  location_id uuid NOT NULL,
  CONSTRAINT affiliation_pkey PRIMARY KEY (user_id, organization_id, location_id),
  CONSTRAINT user_affiliation_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT affiliation_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT affiliation_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.book_approvals (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  book_entry_id bigint NOT NULL,
  role_id uuid NOT NULL,
  approved_by uuid,
  action text NOT NULL CHECK (action = ANY (ARRAY['approve'::text, 'reject'::text])),
  comment text,
  acted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT book_approvals_pkey PRIMARY KEY (id),
  CONSTRAINT book_approvals_book_entry_fkey FOREIGN KEY (book_entry_id) REFERENCES public.book_entries(id),
  CONSTRAINT book_approvals_role_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT book_approvals_user_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.book_entries (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  added_by uuid,
  book_id bigint,
  organization_id uuid,
  location_id uuid,
  status_code text NOT NULL DEFAULT 'editing'::text,
  current_role_id uuid,
  CONSTRAINT book_entries_pkey PRIMARY KEY (id),
  CONSTRAINT book_entries_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT book_entries_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT book_entries_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.metadata(id),
  CONSTRAINT book_entries_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(id),
  CONSTRAINT book_entries_status_fkey FOREIGN KEY (status_code) REFERENCES public.book_statuses(code),
  CONSTRAINT book_entries_current_role_fkey FOREIGN KEY (current_role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.book_statuses (
  code text NOT NULL,
  name text NOT NULL,
  CONSTRAINT book_statuses_pkey PRIMARY KEY (code)
);
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT locations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.metadata (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  data jsonb NOT NULL,
  CONSTRAINT metadata_pkey PRIMARY KEY (id)
);
CREATE TABLE public.metadata_history (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  metadata_id bigint NOT NULL,
  book_entry_id bigint NOT NULL,
  approval_id bigint,
  data jsonb NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  changed_by uuid NOT NULL,
  change_reason text,
  CONSTRAINT metadata_history_pkey PRIMARY KEY (id),
  CONSTRAINT metadata_history_metadata_fkey FOREIGN KEY (metadata_id) REFERENCES public.metadata(id),
  CONSTRAINT metadata_history_book_entry_fkey FOREIGN KEY (book_entry_id) REFERENCES public.book_entries(id),
  CONSTRAINT metadata_history_approval_fkey FOREIGN KEY (approval_id) REFERENCES public.book_approvals(id),
  CONSTRAINT metadata_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id),
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT user_roles_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);