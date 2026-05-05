# Saha Event v3 — Gestion de Salles des Fêtes en Algérie

Plateforme cloud de réservation et gestion de salles des fêtes, construite avec **Next.js 14**, **Supabase**, **Tailwind CSS** et un design system inspiré d'**Odoo**.

---

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Installation & Déploiement](#installation--déploiement)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Analyse économique & technique](#analyse-économique--technique)

---

## 🎯 Vue d'ensemble

### Contexte : Mission 4 — Projet modulaire (40% final)

**Thème :** #9 Saha-Event  
**Groupe de 4 :** Développement full-stack cloud  
**Période :** Avril 2026

### Spécification du projet (Table A, B, C)

| Table | Nom         | Rôle                                           |
|-------|-------------|------------------------------------------------|
| **A** | `profiles`  | Utilisateurs (clients/organisateurs/admins)   |
| **B** | `salles`    | Salles des fêtes (master data)                |
| **C** | `reservations` | Jointure A+B + dates/statut/montant/reçu  |
| **Storage** | `receipts` | Fichiers PDF CCP (private bucket)         |

---

## 🏗️ Architecture

### Stack technologique

```
Frontend:    Next.js 14 + React 18 + TypeScript
Styling:     Tailwind CSS v3 + Design System Odoo
DB:          Supabase PostgreSQL + RLS
Auth:        Supabase Auth (email/password)
Charts:      Recharts 2.12
Icons:       Lucide React
Dates:       date-fns
Hosting:     Vercel
```

### Schéma base de données

```sql
-- Utilisateurs (extension auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  wilaya TEXT,
  role TEXT CHECK (role IN ('client','organisateur','admin')) DEFAULT 'client',
  created_at TIMESTAMP DEFAULT now()
);

-- Salles des fêtes
CREATE TABLE salles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  ville TEXT,
  wilaya TEXT NOT NULL,
  adresse TEXT,
  telephone TEXT,
  capacite INT NOT NULL,
  prix_par_jour DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  gallery_urls TEXT[],
  amenities TEXT[],
  note_moyenne DECIMAL(3,2) DEFAULT 0,
  nb_avis INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  organisateur_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Réservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  salle_id UUID NOT NULL REFERENCES salles(id) ON DELETE RESTRICT,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  nombre_invites INT,
  type_evenement TEXT CHECK (type_evenement IN ('mariage','anniversaire','fiancailles','conference','gala','autre')),
  statut TEXT CHECK (statut IN ('en_attente','confirmee','annulea','terminee')) DEFAULT 'en_attente',
  montant_total DECIMAL(10,2),
  notes TEXT,
  recu_paiement_url TEXT,
  recu_paiement_path TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Storage Supabase
-- Bucket: receipts (private, authenticated access only)
```

### Row-Level Security (RLS)

Chaque utilisateur ne voit **que ses propres données** :

```sql
-- Clients voient leurs réservations
CREATE POLICY "Clients see own reservations"
  ON reservations FOR SELECT
  USING (client_id = auth.uid());

-- Admins voient tout
CREATE POLICY "Admins see all reservations"
  ON reservations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## 📦 Structure du projet

```
saha-event-v3/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page hero + features
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Design system Odoo complet
│   │   ├── auth/
│   │   │   └── page.tsx             # Login/Register split-panel
│   │   ├── halls/
│   │   │   ├── page.tsx             # List/Kanban view (Odoo)
│   │   │   └── [id]/page.tsx        # Hall detail + form view
│   │   ├── reserve/
│   │   │   └── [id]/page.tsx        # Booking form + PDF upload
│   │   ├── dashboard/
│   │   │   ├── page.tsx             # Client dashboard + analytics
│   │   │   └── reservations/
│   │   │       └── page.tsx         # My reservations list
│   │   └── admin/
│   │       └── page.tsx             # Admin console (RLS protected)
│   ├── components/
│   │   ├── OdooTopNav.tsx           # Barre noire Odoo
│   │   ├── SubNav.tsx               # Onglets secondaires
│   │   └── WebsiteNav.tsx           # Nav site public
│   └── lib/
│       ├── types.ts                 # TypeScript types
│       ├── supabase.ts              # Client singleton
│       └── supabase-server.ts       # Server client (middleware)
├── supabase/
│   └── schema.sql                   # DDL complet
├── middleware.ts                    # Auth guard + redirects
├── tailwind.config.js               # Tokens Odoo
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## ✨ Fonctionnalités

### Public (non authentifié)

- **Landing page** : héro, statistiques, features (4 cartes), galerie salles, CTA
- **Catalogue salles** : filtres, recherche, cartes avec images et ratings
- **Authentification** : login/register avec Supabase Auth

### Client (authentifié)

- **Browse salles** : vue liste/kanban, filtre par wilaya/prix/capacité
- **Détail salle** : images, amenities, tel, stat buttons (3 réservations, CA, note)
- **Réservation** : event type picker (6 types avec icônes), date range, guests, drag-drop PDF CCP
- **Dashboard** : KPI stats (4 cartes), AreaChart + BarChart recharts, mes réservations, annulation
- **Mes réservations** : liste filtrée par statut, lien PDF reçu, actions

### Admin (rôle='admin', RLS protected)

- **Console analytique** : KPI globaux, trend 7j, pie chart statuts, bar chart types, top salles, dernières résa
- **Données complètes** : accès RLS à toutes les réservations

---

## 🚀 Installation & Déploiement

### 1. Prérequis locaux

```bash
# Node ≥18
node --version

# Clone ou extract l'archive
cd saha-event-v3

# Installer dépendances
npm install
```

### 2. Configuration Supabase

```bash
# 1. Créer project sur supabase.com
# 2. Copier "Connexion URL" et "Clé anon"
cp .env.local.example .env.local
```

Éditer `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Initialiser la base de données

Supabase → SQL Editor → **Exécuter** `supabase/schema.sql` complet

Cela crée :
- Tables profiles, salles, reservations
- Trigger auto-update
- Bucket receipts
- RLS policies
- 6 salles de démo

### 4. Développement local

```bash
npm run dev
# → http://localhost:3000

# Compte de test
Email: test@saha-event.dz
Mot de passe: Test1234!
```

### 5. Déploiement Vercel

```bash
# 1. Push sur GitHub
git remote add origin https://github.com/username/saha-event-v3
git push -u origin main

# 2. Vercel Dashboard → Import project
# Sélectionner le repo GitHub

# 3. Ajouter env vars
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 4. Deploy ✓
# → https://saha-event-v3.vercel.app
```

---

## 📊 Analyse économique & technique

### CAPEX (Investissement initial)

| Élément | Coût | Durée |
|---------|------|-------|
| **Développement** | 3000–5000 DA (outsourcing) | 4 semaines |
| **Design/UX** | 1000–2000 DA | 1 semaine |
| **Infrastructure Supabase** | 0 DA (free tier) | — |
| **Domaine** | 1500 DA/an | Renouvelable |
| **Total** | **~5500–8500 DA** | — |

**Free tier Supabase suffisant pour :**
- 500 000 requêtes/mois
- 1 GB stockage
- 7 utilisateurs concurrents
- RLS SQL illimité

### OPEX (Coûts mensuels)

| Élément | Montant |
|---------|---------|
| **Hosting Vercel** | 0–20 $/mois (pro) |
| **Supabase Pro** (si dépassement) | 25 $/mois |
| **Domaine** | ~125 DA/mois |
| **CDN images** | ~5 $/mois |
| **Total** | **~150–300 DA/mois** |

### Modèle de revenu proposé

**Commission par réservation confirmée :**
- 2–5% du montant total
- Exemple : 240 000 DA × 3% = 7 200 DA/réservation

**Avec 50 réservations/mois :**
- Revenu : 360 000 DA
- Profit (après OPEX) : ~350 000 DA/mois

### Scalabilité Vercel vs Data Center physique

| Aspect | Vercel (Cloud) | Data center physique |
|--------|----------------|----------------------|
| **Montée en charge** | Automatique (serverless) | Achat de serveurs |
| **Latence** | 50–100 ms (CDN global) | 100–200 ms local |
| **Disponibilité** | 99.95% SLA | ~95% (maintenance) |
| **Coûts** | Proportionnels à usage | Fixes + maintenance |
| **Flexibilité** | Accès API immédiat | Investissement lourd |
| **Support** | Enterprise 24/7 | Technique interne |

**Recommandation :** Cloud (Vercel) pour MVP. Datacenter seulement si >1M réservations/an.

### Données structurées vs non-structurées

| Type | Exemple | Stockage | Accès |
|------|---------|----------|-------|
| **Structurées** (SQL) | Dates, prix, statut | PostgreSQL | Rapide, indexé |
| **Non-structurées** (Blob) | PDF reçu CCP | Storage bucket | Via URL, pas requête |

**Architecture :** PostgreSQL (requêtes vite) + Storage (documents) = **optimal**.

---


- **H1 :** 28px / 700 / -0.4px letter-spacing
- **H2 :** 24px / 700 / -0.3px
- **Body :** 13px / 400 / 1.5 line-height
- **Label :** 11px / 600 / 0.05em uppercase

---

## 🔐 Sécurité

✅ **Row-Level Security (RLS) SQL** — Au niveau BD  
✅ **Auth Supabase** — MFA, tokens JWT, refresh tokens  
✅ **CORS** — Supabase gère automatiquement  
✅ **HTTPS uniquement** — Vercel + Supabase  
✅ **Bucket privé** — PDFs visibles seulement au propriétaire  


---

## 📝 Notes

- **Comptes de test inclus** : test@saha-event.dz / Test1234!
- **Salles de démo** : 6 salles (Alger, Oran, Constantine, Tlemcen, Zeralda, Annaba)
- **PDF upload** : Drag-drop avec validation size
- **Recharts intégrés** : AreaChart, BarChart, PieChart, temps réel
- **RLS forcée** : Impossible d'accéder aux données d'autrui même en SQL direct
- **Responsive** : Mobile-first, grilles adaptatives

---

## 📞 Support & Contact

**Groupe :** MERZOUK .ALAM . ALEOUCHE 2CP from G7  
**Date** : Avril 2026  
**Déploiement** : not yet

---

**Bon événement ! 🎉**
