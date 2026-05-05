-- ============================================================
-- SAHA EVENT v2 — Database Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- TABLE A: profiles (Clients / Owners / Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  wilaya      TEXT,
  role        TEXT DEFAULT 'client' CHECK (role IN ('client','owner','admin')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Client'),
    COALESCE(new.raw_user_meta_data->>'role', 'client')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- TABLE B: salles (Salles des fêtes)
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

-- TABLE C: reservations (Jointure Clients ↔ Salles)
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

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_updated
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TABLE D: salle_comments (Commentaires / Avis sur les salles)
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

-- Auto-create notification when reservation status changes
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

DROP TRIGGER IF EXISTS on_reservation_status_change ON public.reservations;
CREATE TRIGGER on_reservation_status_change
  AFTER UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION notify_reservation_status();

-- Auto-create notification when a new reservation is made (for admin)
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

DROP TRIGGER IF EXISTS on_new_reservation ON public.reservations;
CREATE TRIGGER on_new_reservation
  AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION notify_new_reservation();

-- STORAGE: receipts bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts','receipts',false) ON CONFLICT DO NOTHING;

-- ── RLS POLICIES ────────────────────────────────────────────────
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salle_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Salles: all authenticated users can view, admins can manage
CREATE POLICY "salles_select_public" ON public.salles FOR SELECT USING (true);
CREATE POLICY "salles_insert_admin" ON public.salles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "salles_update_admin" ON public.salles FOR UPDATE USING (public.is_admin());
CREATE POLICY "salles_delete_admin" ON public.salles FOR DELETE USING (public.is_admin());

-- Reservations: clients see own, admins see all
CREATE POLICY "reservations_select_own" ON public.reservations FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "reservations_select_admin" ON public.reservations FOR SELECT USING (public.is_admin());
CREATE POLICY "reservations_insert_own" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "reservations_update_own" ON public.reservations FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "reservations_update_admin" ON public.reservations FOR UPDATE USING (public.is_admin());
CREATE POLICY "reservations_delete_own" ON public.reservations FOR DELETE USING (auth.uid() = client_id);

-- Comments
CREATE POLICY "salle_comments_select" ON public.salle_comments FOR SELECT USING (true);
CREATE POLICY "salle_comments_insert" ON public.salle_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "salle_comments_delete_own" ON public.salle_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "salle_comments_delete_admin" ON public.salle_comments FOR DELETE USING (public.is_admin());

-- Notifications: users see own
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_system" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Storage
CREATE POLICY "receipts_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "receipts_select" ON storage.objects FOR SELECT USING (
  bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "receipts_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ── SEED DATA ────────────────────────────────────────────────────
INSERT INTO public.salles (nom, description, ville, wilaya, capacite, prix_par_jour, image_url, amenities, adresse, telephone, note_moyenne, nb_avis) VALUES
('Palais des Lumières',
 'Un espace grandiose alliant architecture moderne et décoration orientale. Idéal pour les grands mariages et réceptions de prestige avec systèmes audio-visuels de pointe et éclairage LED personnalisable.',
 'Alger','Alger',500,120000,'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
 ARRAY['DJ & Sono professionnelle','Traiteur halal','Décoration florale','Parking 200 véhicules','Climatisation','WiFi fibre','Photobooth','Sécurité 24/7'],
 '12 Rue des Frères Bouadou, Bir Mourad Raïs','023 XX XX XX',4.8,124),
('Villa Jasmine',
 'Niché dans un parc de 3 hectares avec vue panoramique sur la mer Méditerranée. Villa Jasmine offre un cadre intimiste incomparable pour vos célébrations les plus précieuses.',
 'Zeralda','Alger',250,85000,'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
 ARRAY['Jardin privatif 3 ha','Traiteur VIP','Hébergement 10 chambres','Piscine chauffée','Parking gardé','Vue mer panoramique'],
 'Route de Zeralda Bord de mer','021 XX XX XX',4.9,89),
('Salle Al Andalous',
 'Inspirée de l''architecture andalouse, cette salle marie arcs mauresques, zelliges et jardins intérieurs pour des célébrations chargées d''histoire et d''authenticité culturelle.',
 'Oran','Oran',400,95000,'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
 ARRAY['Fontaines intérieures','DJ & Sono','Traiteur halal','Parking 150 véhicules','Climatisation','Scène professionnelle'],
 'Boulevard Millénium, Bir El Djir','041 XX XX XX',4.7,67),
('Le Grand Pavillon',
 'Espace modulable d''exception au cœur de Constantine. Capacité flexible de 100 à 600 invités avec terrasse panoramique sur les ponts historiques.',
 'Constantine','Constantine',600,110000,'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800',
 ARRAY['Terrasse panoramique','Scène professionnelle','Régie son & lumière','Vestiaire','Parking VIP'],
 'Cité Zouaghi Slimane','031 XX XX XX',4.6,52),
('Riad El Baraka',
 'Au cœur de la médina de Tlemcen, ce riad restauré conserve l''authenticité de l''architecture arabo-berbère avec hammam privatif et terrasse avec vue sur les minarets.',
 'Tlemcen','Tlemcen',150,65000,'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
 ARRAY['Cour intérieure','Hammam privatif','Salon marocain','Traiteur traditionnel','WiFi','Hébergement'],
 'Rue Sidi Bel Abbès, Médina','043 XX XX XX',4.9,103),
('Espace Horizon',
 'Salle moderne de standing en bord de mer avec design épuré et équipements high-tech pour conférences, galas et réceptions d''entreprise.',
 'Annaba','Annaba',300,75000,'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
 ARRAY['Écrans LED 8K','Fibre optique','Cuisine équipée','Bar & lounge','Parking souterrain','Sécurité'],
 'Corniche de l''Est','038 XX XX XX',4.5,41);
