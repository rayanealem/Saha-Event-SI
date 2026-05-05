'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OdooTopNav from '@/components/OdooTopNav';
import SubNav from '@/components/SubNav';
import ConfirmDialog from '@/components/ConfirmDialog';
import { createClient } from '@/lib/supabase';
import type { Reservation, Profile } from '@/lib/types';
import { Loader2, CalendarDays, FileText, Trash2, Printer } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SkeletonPage } from '@/components/SkeletonLoader';

// Lazy load chart wrappers (single dynamic import instead of per-component)
const DashboardTrendChart = dynamic(() => import('@/components/Charts').then(m => ({ default: m.DashboardTrendChart })), { ssr: false });
const DashboardEventTypeChart = dynamic(() => import('@/components/Charts').then(m => ({ default: m.DashboardEventTypeChart })), { ssr: false });

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

export default function DashboardPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Mois en cours');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [printingReceipt, setPrintingReceipt] = useState<Reservation | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Reservation | null>(null);
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      const [profRes, resaRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('reservations').select('*, salle:salles(*)').eq('client_id', user.id).order('created_at', { ascending: false }),
      ]);
      setProfile(profRes.data);
      setReservations((resaRes.data as Reservation[]) ?? []);
      setLoading(false);
      setTimeout(() => setChartsReady(true), 100);
    })();
  }, []);

  // Issue #3: Signed URL for private receipts
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

  if (loading) return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />
      <div className="o-content"><SkeletonPage /></div>
    </div>
  );

  const total   = reservations.length;
  const conf    = reservations.filter(r => r.statut === 'confirmee').length;
  const pending = reservations.filter(r => r.statut === 'en_attente').length;
  const amount  = reservations.filter(r => r.statut !== 'annulee').reduce((s, r) => s + (r.montant_total ?? 0), 0);

  // 7-day trend
  const trend = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStr = format(d, 'yyyy-MM-dd');
    return {
      date: format(d, 'dd/MM'),
      count: reservations.filter(r => r.created_at?.startsWith(dayStr)).length,
      montant: reservations.filter(r => r.created_at?.startsWith(dayStr) && r.statut !== 'annulee').reduce((s, r) => s + (r.montant_total ?? 0), 0) / 1000,
    };
  });

  // By type
  const byType = Object.entries(
    reservations.reduce((acc, r) => { const t = r.type_evenement ?? 'autre'; acc[t] = (acc[t] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name: (EVENT_ICONS[name] ?? '') + ' ' + name, count }));

  const KPIS = [
    { label: 'Total réservations', val: total,  color: '#714B67', cls: 'purple' },
    { label: 'Confirmées',          val: conf,   color: '#28A745', cls: 'green' },
    { label: 'En attente',          val: pending, color: '#E9A800', cls: 'amber' },
    { label: 'Montant engagé',      val: amount.toLocaleString('fr-DZ') + ' DA', color: '#0078BF', cls: 'blue' },
  ];

  const COLS = '28px 90px 1fr 110px 90px 120px 150px';

  return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />

      {/* Print Receipt Template (hidden, shown only during print) */}
      {printingReceipt && (
        <div className="print-receipt-container">
          <div style={{ maxWidth: 600, margin: '0 auto', padding: 40, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            {/* Receipt Header */}
            <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: '3px solid #714B67', paddingBottom: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#714B67', marginBottom: 4 }}>Saha Event</div>
              <div style={{ fontSize: 12, color: '#888' }}>Plateforme de réservation de salles des fêtes</div>
              <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700, color: '#212529' }}>REÇU DE RÉSERVATION</div>
            </div>

            {/* Receipt Info */}
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

            {/* Reservation Details */}
            <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ background: '#F8F9FC', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Détails de la réservation</div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Salle', printingReceipt.salle?.nom ?? '—'],
                  ['Localisation', printingReceipt.salle ? `${printingReceipt.salle.ville}, ${printingReceipt.salle.wilaya}` : '—'],
                  ['Type d\'événement', `${EVENT_ICONS[printingReceipt.type_evenement ?? 'autre']} ${EVENT_LABELS[printingReceipt.type_evenement ?? 'autre'] ?? printingReceipt.type_evenement}`],
                  ['Date de début', format(parseISO(printingReceipt.date_debut), 'dd MMMM yyyy', { locale: fr })],
                  ['Date de fin', format(parseISO(printingReceipt.date_fin), 'dd MMMM yyyy', { locale: fr })],
                  ['Nombre d\'invités', `${printingReceipt.nombre_invites} personnes`],
                  ['Statut', STATUS[printingReceipt.statut]?.label ?? printingReceipt.statut],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#888' }}>{k}</span>
                    <span style={{ color: '#333', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div style={{ background: '#F3EFF2', borderRadius: 8, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>Montant Total</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#714B67' }}>
                {printingReceipt.montant_total?.toLocaleString('fr-DZ') ?? '—'} DA
              </span>
            </div>

            {printingReceipt.notes && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, fontStyle: 'italic' }}>{printingReceipt.notes}</div>
              </div>
            )}

            {/* Footer */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
                Saha Event — Plateforme de réservation de salles des fêtes en Algérie<br />
                © 2026 Saha Event · Architecture Cloud & Vibe Programming
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="o-actionbar">
        <div className="o-breadcrumb">
          <span className="o-breadcrumb-current">
            Bonjour, {profile?.full_name?.split(' ')[0] ?? 'Client'} 👋
          </span>
          {profile?.wilaya && <span style={{ color: '#AAAAAA', fontSize: 12 }}>· {profile.wilaya}</span>}
        </div>
        <select
          className="o-btn o-btn-secondary"
          value={period}
          onChange={e => setPeriod(e.target.value)}
          style={{ cursor: 'pointer' }}
        >
          {['Mois en cours', '3 derniers mois', 'Cette année', 'Tout'].map(p => <option key={p}>{p}</option>)}
        </select>
        <Link href="/halls" className="o-btn o-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
          Nouvelle réservation
        </Link>
      </div>

      <div className="o-content o-dashboard">
        {/* KPI cards with staggered animation */}
        <div className="o-kpi-grid">
          {KPIS.map((k, i) => (
            <div 
              key={k.label} 
              className={`o-kpi-card ${k.cls}`}
              style={{
                animation: `o-slide-in-up 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 100}ms backwards`
              }}
            >
              <div className="o-kpi-label">{k.label}</div>
              <div className="o-kpi-val" style={{ color: k.color }}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 14 }}>
          <div className="o-chart-card">
            <div className="o-chart-head">
              <div className="o-chart-title">Activité des 7 derniers jours</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#888' }}>
                <span>Réservations</span>
              </div>
            </div>
            <DashboardTrendChart data={trend} />
          </div>

          <div className="o-chart-card">
            <div className="o-chart-head"><div className="o-chart-title">Par type d&apos;événement</div></div>
            {byType.length > 0 ? (
              <DashboardEventTypeChart data={byType} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, fontSize: 12, color: '#AAAAAA' }}>
                Aucune donnée
              </div>
            )}
          </div>
        </div>

        {/* Reservations list */}
        <div className="o-chart-card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F0F0F0' }}>
            <div className="o-chart-title">Mes réservations</div>
            <Link href="/dashboard/reservations" className="o-btn o-btn-link o-btn-sm">Voir tout →</Link>
          </div>
          {reservations.length === 0 ? (
            <div className="o-empty" style={{ padding: 32 }}>
              <CalendarDays className="o-empty-icon" style={{ width: 32, height: 32 }} />
              <div className="o-empty-title">Aucune réservation</div>
              <div className="o-empty-sub">Vous n&apos;avez pas encore réservé de salle</div>
              <Link href="/halls" className="o-btn o-btn-primary o-btn-sm">Parcourir les salles</Link>
            </div>
          ) : (
            <div className="o-list">
              <div className="o-list-header" style={{ gridTemplateColumns: COLS }}>
                <div /><div className="o-list-header-cell">Réf.</div><div className="o-list-header-cell">Salle</div>
                <div className="o-list-header-cell">Type</div><div className="o-list-header-cell">Date</div>
                <div className="o-list-header-cell">Montant</div><div className="o-list-header-cell">Statut / Actions</div>
              </div>
              {reservations.slice(0, 8).map((r, i) => {
                const s = STATUS[r.statut];
                return (
                  <div key={r.id} className="o-list-row" style={{ gridTemplateColumns: COLS, opacity: r.statut === 'annulee' ? .55 : 1 }}>
                    <div />
                    <div className="o-cell" style={{ fontSize: 11, color: '#888' }}>#{String(i + 1).padStart(3, '0')}</div>
                    <div className="o-cell" style={{ fontWeight: 500 }}>{r.salle?.nom ?? '—'}</div>
                    <div className="o-cell">
                      <span style={{ fontSize: 12 }}>{EVENT_ICONS[r.type_evenement ?? 'autre']} {r.type_evenement ?? '—'}</span>
                    </div>
                    <div className="o-cell o-cell-muted" style={{ fontSize: 11 }}>
                      {format(parseISO(r.date_debut), 'dd MMM yy', { locale: fr })}
                    </div>
                    <div className="o-cell o-cell-amount">
                      {r.montant_total ? r.montant_total.toLocaleString('fr-DZ') + ' DA' : '—'}
                    </div>
                    <div className="o-cell" style={{ overflow: 'visible' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className={`o-badge ${s.cls}`} style={{ fontSize: 10 }}>{s.label}</span>
                        {r.recu_paiement_path && (
                          <button onClick={() => openReceipt(r.recu_paiement_path)} title="Voir reçu"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0 }}>
                            <FileText style={{ width: 12, height: 12 }} />
                          </button>
                        )}
                        {/* Print Receipt Button */}
                        {(r.statut === 'confirmee' || r.statut === 'terminee') && (
                          <button 
                            onClick={() => printReceipt(r)} 
                            title="Imprimer le reçu"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#714B67', padding: 0 }}
                          >
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

        {/* RLS notice */}
        <div style={{ background: '#F3EFF2', border: '1px solid #D4C3D0', borderRadius: 4, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#714B67" strokeWidth="2" style={{ marginTop: 1, flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p style={{ fontSize: 11, color: '#5E3D56', lineHeight: 1.6 }}>
            <strong>Sécurité RLS activée :</strong> Seules vos propres réservations sont visibles ici grâce aux politiques Row-Level Security de Supabase PostgreSQL.
          </p>
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
    </div>
  );
}
