'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OdooTopNav from '@/components/OdooTopNav';
import SubNav from '@/components/SubNav';
import ConfirmDialog from '@/components/ConfirmDialog';
import { createClient } from '@/lib/supabase';
import type { Reservation, Profile } from '@/lib/types';
import { Loader2, CalendarDays, Printer, FileText, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';
import { SkeletonList } from '@/components/SkeletonLoader';

const TABS = [
  { label: 'Tableau de bord', href: '/dashboard' },
  { label: 'Mes réservations', href: '/dashboard/reservations' },
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

const EVENT_LABELS: Record<string, string> = {
  mariage: 'Mariage', anniversaire: 'Anniversaire', fiancailles: 'Fiançailles',
  conference: 'Conférence', gala: 'Gala', autre: 'Autre',
};

const PAGE_SIZE = 10;

export default function ReservationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Reservation | null>(null);
  const [printingReceipt, setPrintingReceipt] = useState<Reservation | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth?session=expired'); return; }

    const [{ data: profData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ]);
    setProfile(profData as Profile);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let query = supabase.from('reservations').select('*, salle:salles(*)', { count: 'exact' })
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (filter !== 'all') query = query.eq('statut', filter);
    query = query.range(from, to);

    const { data, count } = await query;
    setReservations((data as Reservation[]) ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(0); }, [filter, debouncedSearch]);

  // Issue #3: Generate signed URL for private receipts
  const openReceipt = async (path: string | null) => {
    if (!path) return;
    const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const cancel = async () => {
    if (!confirmCancel) return;
    setCancelling(confirmCancel.id);
    await supabase.from('reservations').update({ statut: 'annulee' }).eq('id', confirmCancel.id);
    if (confirmCancel.recu_paiement_path) await supabase.storage.from('receipts').remove([confirmCancel.recu_paiement_path]);
    setReservations(p => p.map(x => x.id === confirmCancel.id ? { ...x, statut: 'annulee' as const } : x));
    setCancelling(null);
    setConfirmCancel(null);
  };

  const printReceipt = (r: Reservation) => {
    setPrintingReceipt(r);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintingReceipt(null), 500);
    }, 200);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Client-side search filter on already-loaded data
  const filtered = reservations.filter(r =>
    !debouncedSearch || r.salle?.nom?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  if (loading) return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />
      <div className="o-actionbar"><div className="o-breadcrumb"><span className="o-breadcrumb-current">Mes réservations</span></div></div>
      <div className="o-content"><SkeletonList rows={PAGE_SIZE} cols={6} /></div>
    </div>
  );

  return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />

      {/* Print Receipt Template */}
      {printingReceipt && (
        <div className="print-receipt-container">
          <div style={{ maxWidth: 600, margin: '0 auto', padding: 40, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: '3px solid #714B67', paddingBottom: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#714B67', marginBottom: 4 }}>Saha Event</div>
              <div style={{ fontSize: 12, color: '#888' }}>Plateforme de réservation de salles des fêtes</div>
              <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700, color: '#212529' }}>REÇU DE RÉSERVATION</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Client</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{profile?.full_name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{profile?.wilaya}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Date</div>
                <div style={{ fontSize: 14, color: '#333' }}>{format(new Date(), 'dd MMMM yyyy', { locale: fr })}</div>
                <div style={{ fontSize: 12, color: '#666' }}>Réf: #{printingReceipt.id.substring(0, 8).toUpperCase()}</div>
              </div>
            </div>
            <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ background: '#F8F9FC', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Détails de la réservation</div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Salle', printingReceipt.salle?.nom ?? '—'],
                  ['Localisation', printingReceipt.salle ? `${printingReceipt.salle.ville}, ${printingReceipt.salle.wilaya}` : '—'],
                  ['Type', `${EVENT_ICONS[printingReceipt.type_evenement ?? 'autre']} ${EVENT_LABELS[printingReceipt.type_evenement ?? 'autre'] ?? printingReceipt.type_evenement}`],
                  ['Du', format(parseISO(printingReceipt.date_debut), 'dd MMMM yyyy', { locale: fr })],
                  ['Au', format(parseISO(printingReceipt.date_fin), 'dd MMMM yyyy', { locale: fr })],
                  ['Invités', `${printingReceipt.nombre_invites} personnes`],
                  ['Statut', STATUS[printingReceipt.statut]?.label ?? printingReceipt.statut],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#888' }}>{k}</span>
                    <span style={{ color: '#333', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#F3EFF2', borderRadius: 8, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Montant Total</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#714B67' }}>
                {printingReceipt.montant_total?.toLocaleString('fr-DZ') ?? '—'} DA
              </span>
            </div>
            <div style={{ borderTop: '1px solid #eee', paddingTop: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
                Saha Event — Plateforme de réservation de salles des fêtes en Algérie<br />
                © 2026 Saha Event · Architecture Cloud &amp; Vibe Programming
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="o-actionbar">
        <div className="o-breadcrumb">
          <span className="o-breadcrumb-current">Mes réservations</span>
        </div>
        <Link href="/halls" className="o-btn o-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
          Nouvelle réservation
        </Link>
      </div>

      <div className="o-searchbar">
        <div className="o-search-input">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#AAAAAA" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input className="o-search-field" placeholder="Rechercher par salle..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all','en_attente','confirmee','annulee','terminee'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`o-btn ${filter === s ? 'o-btn-primary' : 'o-btn-secondary'}`} style={{ fontSize: 11 }}>
              {s === 'all' ? 'Toutes' : STATUS[s as keyof typeof STATUS]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="o-viewbar">
        <span className="o-records-count">{totalCount} réservation{totalCount > 1 ? 's' : ''}</span>
        <div className="o-pager">
          <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} / {totalCount}</span>
          <button className="o-pager-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
          <button className="o-pager-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      </div>

      <div className="o-content">
        {filtered.length === 0 ? (
          <div className="o-empty" style={{ padding: 48 }}>
            <CalendarDays className="o-empty-icon" style={{ width: 40, height: 40 }} />
            <div className="o-empty-title">Aucune réservation trouvée</div>
            <div className="o-empty-sub">Essayez de modifier vos filtres ou créez une nouvelle réservation</div>
            <Link href="/halls" className="o-btn o-btn-primary o-btn-sm">Parcourir les salles</Link>
          </div>
        ) : (
          <div className="o-list">
            <div className="o-list-header" style={{ gridTemplateColumns: '28px 80px 1fr 100px 90px 120px 160px' }}>
              <div /><div className="o-list-header-cell">Réf.</div><div className="o-list-header-cell">Salle</div>
              <div className="o-list-header-cell">Type</div><div className="o-list-header-cell">Dates</div>
              <div className="o-list-header-cell">Montant</div><div className="o-list-header-cell">Statut / Actions</div>
            </div>
            {filtered.map((r, i) => {
              const s = STATUS[r.statut];
              return (
                <div key={r.id} className={`o-list-row ${r.statut === 'annulee' ? 'selected' : ''}`}
                  style={{ gridTemplateColumns: '28px 80px 1fr 100px 90px 120px 160px', opacity: r.statut === 'annulee' ? .55 : 1 }}>
                  <div />
                  <div className="o-cell" style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>#{String(page * PAGE_SIZE + i + 1).padStart(3, '0')}</div>
                  <Link href={`/halls/${r.salle_id}`} className="o-cell o-cell-link">{r.salle?.nom ?? '—'}</Link>
                  <div className="o-cell"><span style={{ fontSize: 11 }}>{EVENT_ICONS[r.type_evenement ?? 'autre']} {EVENT_LABELS[r.type_evenement ?? 'autre']}</span></div>
                  <div className="o-cell o-cell-muted" style={{ fontSize: 11 }}>
                    {format(parseISO(r.date_debut), 'dd MMM', { locale: fr })} → {format(parseISO(r.date_fin), 'dd MMM', { locale: fr })}
                  </div>
                  <div className="o-cell o-cell-amount">
                    {r.montant_total ? r.montant_total.toLocaleString('fr-DZ') + ' DA' : '—'}
                  </div>
                  <div className="o-cell" style={{ overflow: 'visible' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className={`o-badge ${s.cls}`} style={{ fontSize: 10 }}>{s.label}</span>
                      {/* Issue #3: Use signed URL for receipt */}
                      {r.recu_paiement_path && (
                        <button onClick={() => openReceipt(r.recu_paiement_path)} title="Voir reçu"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0 }}>
                          <FileText style={{ width: 12, height: 12 }} />
                        </button>
                      )}
                      {(r.statut === 'confirmee' || r.statut === 'terminee') && (
                        <button onClick={() => printReceipt(r)} title="Imprimer le reçu"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#714B67', padding: 0 }}>
                          <Printer style={{ width: 12, height: 12 }} />
                        </button>
                      )}
                      {r.statut === 'en_attente' && (
                        <button onClick={() => setConfirmCancel(r)} disabled={cancelling === r.id}
                          title="Annuler" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC3545', padding: 0, opacity: cancelling === r.id ? .4 : 1 }}>
                          {cancelling === r.id ? <Loader2 className="o-spin" style={{ width: 12, height: 12 }} /> : <Trash2 style={{ width: 12, height: 12 }} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Issue #12: Custom confirm dialog */}
      <ConfirmDialog
        open={!!confirmCancel}
        title="Annuler la réservation"
        message={confirmCancel ? `Voulez-vous vraiment annuler votre réservation pour "${confirmCancel.salle?.nom ?? 'cette salle'}" ?` : ''}
        confirmLabel="Annuler la réservation"
        onConfirm={cancel}
        onCancel={() => setConfirmCancel(null)}
        danger={true}
      />
    </div>
  );
}
