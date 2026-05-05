'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import OdooTopNav from '@/components/OdooTopNav';
import SubNav from '@/components/SubNav';
import ConfirmDialog from '@/components/ConfirmDialog';
import { createClient } from '@/lib/supabase';
import type { Reservation, Salle } from '@/lib/types';
import { ShieldAlert, CalendarDays, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SkeletonList } from '@/components/SkeletonLoader';

const TABS = [
  { label: 'Tableau de bord', href: '/dashboard' },
  { label: 'Mes salles', href: '/owner/salles' },
  { label: 'Réservations reçues', href: '/owner/reservations' },
  { label: 'Mon activité', href: '/owner/dashboard' },
];

const STATUS = {
  en_attente: { label: 'En attente', cls: 'o-badge-wait' },
  confirmee:  { label: 'Confirmée',  cls: 'o-badge-conf' },
  annulee:    { label: 'Annulée',    cls: 'o-badge-cancel' },
  terminee:   { label: 'Terminée',   cls: 'o-badge-done' },
};

const EVENT_ICONS: Record<string, string> = {
  mariage: '💍', anniversaire: '🎂', fiancailles: '💐', conference: '🎤', gala: '✨', autre: '🎉',
};

export default function OwnerReservationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [filter, setFilter] = useState('all');
  const [pendingStatus, setPendingStatus] = useState<{ id: string; statut: 'confirmee' | 'annulee'; salleName: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      const prof = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (prof.data?.role !== 'owner') { router.push('/dashboard'); return; }
      setAuthorized(true);

      // Fetch owner's halls
      const { data: sallesData } = await supabase.from('salles').select('id').eq('owner_id', user.id);
      const salleIds = (sallesData ?? []).map(s => s.id);

      if (salleIds.length > 0) {
        const { data: resData } = await supabase
          .from('reservations')
          .select('*, salle:salles(*), client:profiles!reservations_client_id_fkey(full_name, phone, wilaya)')
          .in('salle_id', salleIds)
          .order('created_at', { ascending: false });
        setReservations((resData as Reservation[]) ?? []);
      }
      setLoading(false);
    })();
  }, []);

  const requestStatusChange = (id: string, statut: 'confirmee' | 'annulee', salleName: string) => {
    setPendingStatus({ id, statut, salleName });
  };

  const updateStatus = async () => {
    if (!pendingStatus) return;
    const { error } = await supabase.from('reservations').update({ statut: pendingStatus.statut }).eq('id', pendingStatus.id);
    if (!error) {
      setReservations(prev => prev.map(r => r.id === pendingStatus.id ? { ...r, statut: pendingStatus.statut } : r));
    } else {
      alert("Erreur de mise à jour. Vérifiez vos permissions.");
    }
    setPendingStatus(null);
  };

  const openReceipt = async (path: string | null) => {
    if (!path) return;
    const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter(r => r.statut === filter);

  if (loading) return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />
      <div className="o-actionbar"><div className="o-breadcrumb"><span className="o-breadcrumb-current">Réservations reçues</span></div></div>
      <div className="o-content"><SkeletonList rows={8} cols={6} /></div>
    </div>
  );

  if (!authorized) return (
    <div className="o-app">
      <OdooTopNav />
      <div className="o-empty" style={{ flex: 1 }}>
        <ShieldAlert style={{ width: 40, height: 40, color: '#DC3545' }} />
        <div className="o-empty-title">Accès refusé</div>
        <div className="o-empty-sub">Cette page est réservée aux propriétaires</div>
      </div>
    </div>
  );

  return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />

      <div className="o-actionbar">
        <div className="o-breadcrumb">
          <span className="o-breadcrumb-current">📋 Réservations reçues sur mes salles</span>
        </div>
      </div>

      {/* Filters */}
      <div className="o-searchbar">
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'en_attente', 'confirmee', 'annulee', 'terminee'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`o-btn ${filter === s ? 'o-btn-primary' : 'o-btn-secondary'}`} style={{ fontSize: 11 }}>
              {s === 'all' ? 'Toutes' : STATUS[s as keyof typeof STATUS]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="o-viewbar">
        <span className="o-records-count">{filtered.length} réservation{filtered.length > 1 ? 's' : ''}</span>
      </div>

      <div className="o-content">
        {filtered.length === 0 ? (
          <div className="o-empty" style={{ padding: 48 }}>
            <CalendarDays className="o-empty-icon" style={{ width: 40, height: 40 }} />
            <div className="o-empty-title">Aucune réservation</div>
            <div className="o-empty-sub">Aucune réservation trouvée pour vos salles</div>
          </div>
        ) : (
          <div className="o-list">
            <div className="o-list-header" style={{ gridTemplateColumns: '80px 1fr 120px 100px 90px 100px 180px' }}>
              <div className="o-list-header-cell">Réf.</div>
              <div className="o-list-header-cell">Salle</div>
              <div className="o-list-header-cell">Client</div>
              <div className="o-list-header-cell">Type</div>
              <div className="o-list-header-cell">Dates</div>
              <div className="o-list-header-cell">Statut</div>
              <div className="o-list-header-cell">Actions</div>
            </div>
            {filtered.map((r, i) => {
              const s = STATUS[r.statut];
              return (
                <div key={r.id} className="o-list-row" style={{ gridTemplateColumns: '80px 1fr 120px 100px 90px 100px 180px', height: 'auto', padding: '8px 16px' }}>
                  <div className="o-cell" style={{ fontSize: 11, fontWeight: 500 }}>#{String(i + 1).padStart(4, '0')}</div>
                  <div className="o-cell" style={{ fontWeight: 500 }}>{r.salle?.nom ?? '—'}</div>
                  <div className="o-cell" style={{ fontSize: 11 }}>
                    {(r.client as any)?.full_name ?? '—'}
                  </div>
                  <div className="o-cell">
                    <span style={{ fontSize: 11 }}>{EVENT_ICONS[r.type_evenement ?? 'autre']} {r.type_evenement}</span>
                  </div>
                  <div className="o-cell o-cell-muted" style={{ fontSize: 11 }}>
                    {format(parseISO(r.date_debut), 'dd MMM', { locale: fr })} → {format(parseISO(r.date_fin), 'dd MMM', { locale: fr })}
                  </div>
                  <div className="o-cell">
                    <span className={`o-badge ${s.cls}`} style={{ fontSize: 10 }}>{s.label}</span>
                  </div>
                  <div className="o-cell" style={{ overflow: 'visible' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {r.statut === 'en_attente' && (
                        <>
                          <button className="o-btn o-btn-primary o-btn-sm" onClick={() => requestStatusChange(r.id, 'confirmee', r.salle?.nom ?? '')}>
                            ✓ Confirmer
                          </button>
                          <button className="o-btn o-btn-danger o-btn-sm" onClick={() => requestStatusChange(r.id, 'annulee', r.salle?.nom ?? '')}>
                            ✕ Refuser
                          </button>
                        </>
                      )}
                      {r.recu_paiement_path && (
                        <button onClick={() => openReceipt(r.recu_paiement_path)} title="Voir reçu CCP"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0D47A1', padding: 0 }}>
                          <FileText style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                      {r.montant_total && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#714B67' }}>
                          {r.montant_total.toLocaleString('fr-DZ')} DA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Scope Notice */}
        <div style={{ background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: 4, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#0D47A1" strokeWidth="2" style={{ marginTop: 1, flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p style={{ fontSize: 11, color: '#0D47A1', lineHeight: 1.6 }}>
            <strong>Isolation Propriétaire :</strong> Vous ne voyez que les réservations de vos propres salles. Vous pouvez confirmer ou refuser les demandes en attente.
          </p>
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!pendingStatus}
        title={pendingStatus?.statut === 'confirmee' ? 'Confirmer la réservation' : 'Refuser la réservation'}
        message={pendingStatus ? `Voulez-vous vraiment ${pendingStatus.statut === 'confirmee' ? 'confirmer' : 'refuser'} cette réservation${pendingStatus.salleName ? ` pour "${pendingStatus.salleName}"` : ''} ?` : ''}
        confirmLabel={pendingStatus?.statut === 'confirmee' ? 'Confirmer' : 'Refuser'}
        onConfirm={updateStatus}
        onCancel={() => setPendingStatus(null)}
        danger={pendingStatus?.statut === 'annulee'}
      />
    </div>
  );
}
