-- ============================================================
-- SAHA EVENT v3 — 3-Role Architecture Migration
-- Migrates from (client, organisateur, admin) to (client, owner, admin)
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. MIGRATE EXISTING DATA ─────────────────────────────────
-- Convert all existing 'organisateur' users to 'owner'
UPDATE public.profiles SET role = 'owner' WHERE role = 'organisateur';

-- ── 2. UPDATE ROLE CONSTRAINT ────────────────────────────────
-- Drop old constraint and create new one with 3 roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'owner', 'admin'));

-- Update default value
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'client';

-- ── 3. RENAME organisateur_id → owner_id on salles ───────────
-- Add owner_id column if it doesn't exist, copying from organisateur_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'salles' AND column_name = 'organisateur_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'salles' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.salles RENAME COLUMN organisateur_id TO owner_id;
  END IF;
END $$;

-- ── 4. UPDATE FUNCTIONS ──────────────────────────────────────

-- Updated handle_new_user: only allows 'client' or 'owner' via signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  BEGIN
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'client');
    -- Only allow client or owner via self-registration; admin must be set manually
    IF v_role NOT IN ('client', 'owner') THEN
      v_role := 'client';
    END IF;
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Client'),
      v_role
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', new.id, SQLERRM;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_admin() helper (unchanged but re-created for safety)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- NEW: is_owner() helper
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Updated notify_new_reservation: also notify the hall owner
CREATE OR REPLACE FUNCTION notify_new_reservation()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  salle_name TEXT;
  salle_owner UUID;
BEGIN
  SELECT nom, owner_id INTO salle_name, salle_owner FROM public.salles WHERE id = NEW.salle_id;
  
  -- Notify all admins
  FOR admin_record IN SELECT id FROM public.profiles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      admin_record.id,
      'Nouvelle réservation',
      'Une nouvelle réservation pour "' || COALESCE(salle_name, 'Salle') || '" est en attente de confirmation.',
      'warning',
      '/admin'
    );
  END LOOP;
  
  -- Notify the hall owner if exists
  IF salle_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      salle_owner,
      'Nouvelle réservation',
      'Une nouvelle réservation pour "' || COALESCE(salle_name, 'Salle') || '" est en attente.',
      'warning',
      '/owner/reservations'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. DROP AND RECREATE RLS POLICIES ────────────────────────

-- === PROFILES ===
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- Everyone can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  USING (auth.uid() = id);
-- Admins can read all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT
  USING (public.is_admin());
-- Users can insert their own profile (signup trigger)
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
-- Admins can update any profile (for role changes)
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- === SALLES ===
DROP POLICY IF EXISTS "salles_select_auth" ON public.salles;
DROP POLICY IF EXISTS "salles_select_public" ON public.salles;
DROP POLICY IF EXISTS "salles_insert_admin" ON public.salles;
DROP POLICY IF EXISTS "salles_update_admin" ON public.salles;
DROP POLICY IF EXISTS "salles_delete_admin" ON public.salles;
DROP POLICY IF EXISTS "salles_insert_owner" ON public.salles;
DROP POLICY IF EXISTS "salles_update_owner" ON public.salles;
DROP POLICY IF EXISTS "salles_delete_owner" ON public.salles;

-- Anyone can view halls (public browsing)
CREATE POLICY "salles_select_public" ON public.salles FOR SELECT
  USING (true);
-- Admins can insert any hall
CREATE POLICY "salles_insert_admin" ON public.salles FOR INSERT
  WITH CHECK (public.is_admin());
-- Owners can insert halls (they own them)
CREATE POLICY "salles_insert_owner" ON public.salles FOR INSERT
  WITH CHECK (public.is_owner() AND auth.uid() = owner_id);
-- Admins can update any hall
CREATE POLICY "salles_update_admin" ON public.salles FOR UPDATE
  USING (public.is_admin());
-- Owners can update only their own halls
CREATE POLICY "salles_update_owner" ON public.salles FOR UPDATE
  USING (public.is_owner() AND auth.uid() = owner_id);
-- Admins can delete any hall
CREATE POLICY "salles_delete_admin" ON public.salles FOR DELETE
  USING (public.is_admin());
-- Owners can delete only their own halls
CREATE POLICY "salles_delete_owner" ON public.salles FOR DELETE
  USING (public.is_owner() AND auth.uid() = owner_id);

-- === RESERVATIONS ===
DROP POLICY IF EXISTS "reservations_select_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_select_admin" ON public.reservations;
DROP POLICY IF EXISTS "reservations_select_owner" ON public.reservations;
DROP POLICY IF EXISTS "reservations_insert_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_admin" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_owner" ON public.reservations;
DROP POLICY IF EXISTS "reservations_delete_own" ON public.reservations;

-- Clients see their own reservations
CREATE POLICY "reservations_select_own" ON public.reservations FOR SELECT
  USING (auth.uid() = client_id);
-- Admins see all reservations
CREATE POLICY "reservations_select_admin" ON public.reservations FOR SELECT
  USING (public.is_admin());
-- Owners see reservations for their own halls
CREATE POLICY "reservations_select_owner" ON public.reservations FOR SELECT
  USING (
    public.is_owner() AND EXISTS (
      SELECT 1 FROM public.salles WHERE id = salle_id AND owner_id = auth.uid()
    )
  );
-- Clients can create reservations
CREATE POLICY "reservations_insert_own" ON public.reservations FOR INSERT
  WITH CHECK (auth.uid() = client_id);
-- Clients can update their own (e.g., cancel pending)
CREATE POLICY "reservations_update_own" ON public.reservations FOR UPDATE
  USING (auth.uid() = client_id);
-- Admins can update any
CREATE POLICY "reservations_update_admin" ON public.reservations FOR UPDATE
  USING (public.is_admin());
-- Owners can update reservations on their own halls (confirm/reject)
CREATE POLICY "reservations_update_owner" ON public.reservations FOR UPDATE
  USING (
    public.is_owner() AND EXISTS (
      SELECT 1 FROM public.salles WHERE id = salle_id AND owner_id = auth.uid()
    )
  );
-- Clients can delete their own
CREATE POLICY "reservations_delete_own" ON public.reservations FOR DELETE
  USING (auth.uid() = client_id);

-- === COMMENTS ===
DROP POLICY IF EXISTS "salle_comments_select" ON public.salle_comments;
DROP POLICY IF EXISTS "salle_comments_insert" ON public.salle_comments;
DROP POLICY IF EXISTS "salle_comments_delete_own" ON public.salle_comments;
DROP POLICY IF EXISTS "salle_comments_delete_admin" ON public.salle_comments;

-- Anyone can read comments (public)
CREATE POLICY "salle_comments_select" ON public.salle_comments FOR SELECT
  USING (true);
-- Authenticated users can add comments
CREATE POLICY "salle_comments_insert" ON public.salle_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Users can delete their own comments
CREATE POLICY "salle_comments_delete_own" ON public.salle_comments FOR DELETE
  USING (auth.uid() = user_id);
-- Admins can delete any comment (moderation)
CREATE POLICY "salle_comments_delete_admin" ON public.salle_comments FOR DELETE
  USING (public.is_admin());

-- === NOTIFICATIONS (unchanged logic) ===
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_system" ON public.notifications FOR INSERT
  WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- === STORAGE: receipts ===
DROP POLICY IF EXISTS "receipts_insert" ON storage.objects;
DROP POLICY IF EXISTS "receipts_select" ON storage.objects;
DROP POLICY IF EXISTS "receipts_delete" ON storage.objects;
DROP POLICY IF EXISTS "receipts_select_admin" ON storage.objects;

-- Users can upload their own receipts
CREATE POLICY "receipts_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Users can view their own receipts
CREATE POLICY "receipts_select" ON storage.objects FOR SELECT USING (
  bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Users can delete their own receipts
CREATE POLICY "receipts_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Admins can view all receipts (for validation)
CREATE POLICY "receipts_select_admin" ON storage.objects FOR SELECT USING (
  bucket_id = 'receipts' AND public.is_admin()
);

-- ── 6. CLEANUP ───────────────────────────────────────────────
-- Drop old junction tables if they exist
DROP TABLE IF EXISTS public.gestionnaire_salles CASCADE;
DROP TABLE IF EXISTS public.moderateur_actions CASCADE;

-- ✅ Migration complete! Roles: client, owner, admin
