export type UserRole = 'client' | 'owner' | 'admin';

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  wilaya: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
};

export type EventType = 'mariage' | 'anniversaire' | 'conference' | 'gala' | 'fiancailles' | 'autre';

export type Salle = {
  id: string;
  nom: string;
  description: string | null;
  ville: string;
  wilaya: string;
  capacite: number;
  prix_par_jour: number;
  image_url: string | null;
  gallery_urls: string[];
  amenities: string[];
  adresse: string | null;
  telephone: string | null;
  note_moyenne: number | null;
  nb_avis: number;
  is_available: boolean;
  owner_id: string | null;
  created_at: string;
};

export type ReservationStatus = 'en_attente' | 'confirmee' | 'annulee' | 'terminee';

export type Reservation = {
  id: string;
  client_id: string;
  salle_id: string;
  date_debut: string;
  date_fin: string;
  nombre_invites: number;
  type_evenement: EventType;
  statut: ReservationStatus;
  montant_total: number | null;
  notes: string | null;
  recu_paiement_url: string | null;
  recu_paiement_path: string | null;
  created_at: string;
  updated_at: string;
  salle?: Salle;
  client?: Profile;
};

export type DashboardStats = {
  total_reservations: number;
  confirmees: number;
  en_attente: number;
  montant_total: number;
  salles_disponibles: number;
};

export type SalleComment = {
  id: string;
  salle_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Profile;
};

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link: string | null;
  created_at: string;
};
