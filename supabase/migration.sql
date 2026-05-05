-- ============================================================
-- SAHA EVENT — Full Safe Migration (can be re-run without errors)
-- Paste this ENTIRE block into Supabase SQL Editor and click Run
-- ============================================================

-- ── 1. TABLES ────────────────────────────────────────────────

-- TABLE A: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  wilaya      TEXT,
  role        TEXT DEFAULT 'client' CHECK (role IN ('client','owner','admin')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE B: salles
CREATE TABLE IF NOT EXISTS public.salles (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom             TEXT NOT NULL,
  description     TEXT,
  ville           TEXT NOT NULL,
  wilaya          TEXT NOT NULL,
  capacite        INTEGER NOT NULL,
  prix_par_jour   NUMERIC(10,2) NOT NULL,
  image_url       TEXT,
  gallery_urls    TEXT[] DEFAULT '{}',
  amenities       TEXT[] DEFAULT '{}',
  adresse         TEXT,
  telephone       TEXT,
  note_moyenne    NUMERIC(3,1) DEFAULT 4.5,
  nb_avis         INTEGER DEFAULT 0,
  is_available    BOOLEAN DEFAULT TRUE,
  owner_id        UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE C: reservations
CREATE TABLE IF NOT EXISTS public.reservations (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  salle_id             UUID REFERENCES public.salles(id) ON DELETE CASCADE NOT NULL,
  date_debut           DATE NOT NULL,
  date_fin             DATE NOT NULL,
  nombre_invites       INTEGER DEFAULT 100,
  type_evenement       TEXT DEFAULT 'autre'
    CHECK (type_evenement IN ('mariage','anniversaire','conference','gala','fiancailles','autre')),
  statut               TEXT DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente','confirmee','annulee','terminee')),
  montant_total        NUMERIC(10,2),
  notes                TEXT,
  recu_paiement_url    TEXT,
  recu_paiement_path   TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE D: salle_comments
CREATE TABLE IF NOT EXISTS public.salle_comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salle_id    UUID REFERENCES public.salles(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE E: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  is_read     BOOLEAN DEFAULT FALSE,
  link        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. FUNCTIONS ─────────────────────────────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Handle new user signup (Issue #6: wrapped in BEGIN/EXCEPTION so auth.users insert never fails)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Client'),
      COALESCE(new.raw_user_meta_data->>'role', 'client')
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', new.id, SQLERRM;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Issue #2: Check date availability (returns FALSE if overlap exists)
CREATE OR REPLACE FUNCTION public.check_date_availability(
  p_salle_id UUID,
  p_date_debut DATE,
  p_date_fin DATE,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.reservations
    WHERE salle_id = p_salle_id
      AND statut IN ('en_attente', 'confirmee')
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
      AND date_debut <= p_date_fin
      AND date_fin >= p_date_debut
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Issue #4: Calculate montant_total server-side
CREATE OR REPLACE FUNCTION public.calculate_montant(
  p_salle_id UUID,
  p_date_debut DATE,
  p_date_fin DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_prix NUMERIC;
  v_jours INTEGER;
BEGIN
  SELECT prix_par_jour INTO v_prix FROM public.salles WHERE id = p_salle_id;
  IF v_prix IS NULL THEN RETURN 0; END IF;
  v_jours := GREATEST(1, (p_date_fin - p_date_debut) + 1);
  RETURN v_prix * v_jours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Issue #4: Trigger to enforce server-side montant calculation
CREATE OR REPLACE FUNCTION public.enforce_montant_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant_total := public.calculate_montant(NEW.salle_id, NEW.date_debut, NEW.date_fin);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_montant ON public.reservations;
CREATE TRIGGER enforce_montant
  BEFORE INSERT OR UPDATE OF salle_id, date_debut, date_fin ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_montant_total();

-- Notify on reservation status change
CREATE OR REPLACE FUNCTION notify_reservation_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.client_id,
      CASE NEW.statut
        WHEN 'confirmee' THEN 'Réservation confirmée ✓'
        WHEN 'annulee' THEN 'Réservation annulée'
        WHEN 'terminee' THEN 'Réservation terminée'
        ELSE 'Mise à jour de réservation'
      END,
      CASE NEW.statut
        WHEN 'confirmee' THEN 'Votre réservation a été confirmée avec succès.'
        WHEN 'annulee' THEN 'Votre réservation a été annulée.'
        WHEN 'terminee' THEN 'Votre réservation est terminée. Merci !'
        ELSE 'Le statut de votre réservation a changé.'
      END,
      CASE NEW.statut
        WHEN 'confirmee' THEN 'success'
        WHEN 'annulee' THEN 'error'
        WHEN 'terminee' THEN 'info'
        ELSE 'info'
      END,
      '/dashboard/reservations'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notify admins on new reservation
CREATE OR REPLACE FUNCTION notify_new_reservation()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  salle_name TEXT;
BEGIN
  SELECT nom INTO salle_name FROM public.salles WHERE id = NEW.salle_id;
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin check helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── 3. TRIGGERS ──────────────────────────────────────────────

DROP TRIGGER IF EXISTS reservations_updated ON public.reservations;
CREATE TRIGGER reservations_updated
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS on_reservation_status_change ON public.reservations;
CREATE TRIGGER on_reservation_status_change
  AFTER UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION notify_reservation_status();

DROP TRIGGER IF EXISTS on_new_reservation ON public.reservations;
CREATE TRIGGER on_new_reservation
  AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION notify_new_reservation();

-- ── 4. STORAGE ───────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES ('receipts','receipts',false) ON CONFLICT DO NOTHING;

-- ── 5. ENABLE RLS ────────────────────────────────────────────

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salle_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ── 6. RLS POLICIES (safe: drop then create) ────────────────

-- Profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (public.is_admin());

-- Salles (PUBLIC read — guests can browse without login)
DROP POLICY IF EXISTS "salles_select_auth" ON public.salles;
DROP POLICY IF EXISTS "salles_select_public" ON public.salles;
DROP POLICY IF EXISTS "salles_insert_admin" ON public.salles;
DROP POLICY IF EXISTS "salles_update_admin" ON public.salles;
DROP POLICY IF EXISTS "salles_delete_admin" ON public.salles;
CREATE POLICY "salles_select_public" ON public.salles FOR SELECT USING (true);
CREATE POLICY "salles_insert_admin" ON public.salles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "salles_update_admin" ON public.salles FOR UPDATE USING (public.is_admin());
CREATE POLICY "salles_delete_admin" ON public.salles FOR DELETE USING (public.is_admin());

-- Reservations
DROP POLICY IF EXISTS "reservations_select_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_select_admin" ON public.reservations;
DROP POLICY IF EXISTS "reservations_insert_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_own" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_admin" ON public.reservations;
DROP POLICY IF EXISTS "reservations_delete_own" ON public.reservations;
CREATE POLICY "reservations_select_own" ON public.reservations FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "reservations_select_admin" ON public.reservations FOR SELECT USING (public.is_admin());
CREATE POLICY "reservations_insert_own" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "reservations_update_own" ON public.reservations FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "reservations_update_admin" ON public.reservations FOR UPDATE USING (public.is_admin());
CREATE POLICY "reservations_delete_own" ON public.reservations FOR DELETE USING (auth.uid() = client_id);

-- Comments (PUBLIC read)
DROP POLICY IF EXISTS "salle_comments_select" ON public.salle_comments;
DROP POLICY IF EXISTS "salle_comments_insert" ON public.salle_comments;
DROP POLICY IF EXISTS "salle_comments_delete_own" ON public.salle_comments;
DROP POLICY IF EXISTS "salle_comments_delete_admin" ON public.salle_comments;
CREATE POLICY "salle_comments_select" ON public.salle_comments FOR SELECT USING (true);
CREATE POLICY "salle_comments_insert" ON public.salle_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "salle_comments_delete_own" ON public.salle_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "salle_comments_delete_admin" ON public.salle_comments FOR DELETE USING (public.is_admin());

-- Notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_system" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Storage
DROP POLICY IF EXISTS "receipts_insert" ON storage.objects;
DROP POLICY IF EXISTS "receipts_select" ON storage.objects;
DROP POLICY IF EXISTS "receipts_delete" ON storage.objects;
CREATE POLICY "receipts_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "receipts_select" ON storage.objects FOR SELECT USING (
  bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "receipts_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ── 7. SEED DATA (only inserts if table is empty) ────────────

INSERT INTO public.salles (nom, description, ville, wilaya, capacite, prix_par_jour, image_url, amenities, adresse, telephone, note_moyenne, nb_avis)
SELECT * FROM (VALUES
('Palais des Lumières',
 'Un espace grandiose alliant architecture moderne et décoration orientale. Idéal pour les grands mariages et réceptions de prestige avec systèmes audio-visuels de pointe et éclairage LED personnalisable.',
 'Alger','Alger',500,120000.00,'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
 ARRAY['DJ & Sono professionnelle','Traiteur halal','Décoration florale','Parking 200 véhicules','Climatisation','WiFi fibre','Photobooth','Sécurité 24/7'],
 '12 Rue des Frères Bouadou, Bir Mourad Raïs','023 XX XX XX',4.8,124),
('Villa Jasmine',
 'Niché dans un parc de 3 hectares avec vue panoramique sur la mer Méditerranée. Villa Jasmine offre un cadre intimiste incomparable pour vos célébrations les plus précieuses.',
 'Zeralda','Alger',250,85000.00,'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
 ARRAY['Jardin privatif 3 ha','Traiteur VIP','Hébergement 10 chambres','Piscine chauffée','Parking gardé','Vue mer panoramique'],
 'Route de Zeralda Bord de mer','021 XX XX XX',4.9,89),
('Salle Al Andalous',
 'Inspirée de l''architecture andalouse, cette salle marie arcs mauresques, zelliges et jardins intérieurs pour des célébrations chargées d''histoire et d''authenticité culturelle.',
 'Oran','Oran',400,95000.00,'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
 ARRAY['Fontaines intérieures','DJ & Sono','Traiteur halal','Parking 150 véhicules','Climatisation','Scène professionnelle'],
 'Boulevard Millénium, Bir El Djir','041 XX XX XX',4.7,67),
('Le Grand Pavillon',
 'Espace modulable d''exception au cœur de Constantine. Capacité flexible de 100 à 600 invités avec terrasse panoramique sur les ponts historiques.',
 'Constantine','Constantine',600,110000.00,'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800',
 ARRAY['Terrasse panoramique','Scène professionnelle','Régie son & lumière','Vestiaire','Parking VIP'],
 'Cité Zouaghi Slimane','031 XX XX XX',4.6,52),
('Riad El Baraka',
 'Au cœur de la médina de Tlemcen, ce riad restauré conserve l''authenticité de l''architecture arabo-berbère avec hammam privatif et terrasse avec vue sur les minarets.',
 'Tlemcen','Tlemcen',150,65000.00,'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
 ARRAY['Cour intérieure','Hammam privatif','Salon marocain','Traiteur traditionnel','WiFi','Hébergement'],
 'Rue Sidi Bel Abbès, Médina','043 XX XX XX',4.9,103),
('Espace Horizon',
 'Salle moderne de standing en bord de mer avec design épuré et équipements high-tech pour conférences, galas et réceptions d''entreprise.',
 'Annaba','Annaba',300,75000.00,'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
 ARRAY['Écrans LED 8K','Fibre optique','Cuisine équipée','Bar & lounge','Parking souterrain','Sécurité'],
 'Corniche de l''Est','038 XX XX XX',4.5,41)
) AS seed(nom, description, ville, wilaya, capacite, prix_par_jour, image_url, amenities, adresse, telephone, note_moyenne, nb_avis)
WHERE NOT EXISTS (SELECT 1 FROM public.salles LIMIT 1);

-- ✅ Done! All migrations applied successfully.
