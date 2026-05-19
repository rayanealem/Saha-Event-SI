-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  message text NOT NULL,
  related_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text,
  link text,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'CLIENT'::user_role,
  full_name text,
  phone text,
  kyc_status USER-DEFINED NOT NULL DEFAULT 'UNVERIFIED'::kyc_status,
  kyc_rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reference_code text NOT NULL UNIQUE,
  venue_id uuid NOT NULL,
  client_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_price integer NOT NULL,
  deposit_amount integer NOT NULL,
  ccp_receipt_url text,
  client_message text,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::reservation_status,
  refusal_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id),
  CONSTRAINT reservations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);
CREATE TABLE public.venue_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  venue_id uuid,
  doc_type USER-DEFINED NOT NULL,
  url text NOT NULL,
  note text,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::doc_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venue_documents_pkey PRIMARY KEY (id),
  CONSTRAINT venue_documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id),
  CONSTRAINT venue_documents_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id)
);
CREATE TABLE public.venue_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL,
  url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venue_photos_pkey PRIMARY KEY (id),
  CONSTRAINT venue_photos_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id)
);
CREATE TABLE public.venues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  wilaya text NOT NULL,
  address text NOT NULL,
  description text,
  capacity_max integer NOT NULL,
  area_m2 integer DEFAULT 0,
  price_per_day real NOT NULL,
  deposit_percentage real NOT NULL,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  status USER-DEFINED NOT NULL DEFAULT 'DRAFT'::venue_status,
  ccp_name text,
  ccp_number text,
  ccp_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venues_pkey PRIMARY KEY (id),
  CONSTRAINT venues_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
