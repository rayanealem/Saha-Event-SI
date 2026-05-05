'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import OdooTopNav from '@/components/OdooTopNav';
import SubNav from '@/components/SubNav';
import ConfirmDialog from '@/components/ConfirmDialog';
import { createClient } from '@/lib/supabase';
import type { Reservation, Salle } from '@/lib/types';
import { Loader2, ShieldAlert } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SkeletonPage } from '@/components/SkeletonLoader';

// Lazy load chart wrappers (single dynamic import instead of per-component)
const AdminTrendChart = dynamic(() => import('@/components/Charts').then(m => ({ default: m.AdminTrendChart })), { ssr: false });
const AdminStatusPieChart = dynamic(() => import('@/components/Charts').then(m => ({ default: m.AdminStatusPieChart })), { ssr: false });
const AdminEventTypeChart = dynamic(() => import('@/components/Charts').then(m => ({ default: m.AdminEventTypeChart })), { ssr: false });

const TABS = [
  { label: 'Tableau de bord', href: '/dashboard' },
  { label: 'Gestion des salles', href: '/admin/salles' },
  { label: 'Administration', href: '/admin' },
];

const EVENT_ICONS: Record<string, string> = {
  mariage: '💍', anniversaire: '🎂', fiancailles: '💐', conference: '🎤', gala: '✨', autre: '🎉',
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [data, setData] = useState<{ res: Reservation[], salles: Salle[] }>({ res: [], salles: [] });
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      const prof = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (prof.data?.role !== 'admin') { router.push('/dashboard'); return; }
      setRole('admin');

      const [resData, sallesData] = await Promise.all([
        supabase.from('reservations').select('*, salle:salles(*)').order('created_at', { ascending: false }),
        supabase.from('salles').select('*'),
      ]);
      setData({
        res: (resData.data as Reservation[]) ?? [],
        salles: sallesData.data ?? [],
      });
      setLoading(false);
    })();
  }, []);

  const [pendingStatus, setPendingStatus] = useState<{ id: string; statut: 'confirmee' | 'annulee'; salleName: string } | null>(null);

  const requestStatusChange = (id: string, statut: 'confirmee' | 'annulee', salleName: string) => {
    setPendingStatus({ id, statut, salleName });
  };

  const updateStatus = async () => {
    if (!pendingStatus) return;
    const { error } = await supabase.from('reservations').update({ statut: pendingStatus.statut }).eq('id', pendingStatus.id);
    if (!error) {
      setData(prev => ({ ...prev, res: prev.res.map(r => r.id === pendingStatus.id ? { ...r, statut: pendingStatus.statut } : r) }));
    } else {
      alert("Erreur de mise à jour: Vérifiez vos politiques RLS (Supabase).");
    }
    setPendingStatus(null);
  };

  if (loading) return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />
      <div className="o-content"><SkeletonPage /></div>
    </div>
  );

  if (!role) return (
    <div className="o-app">
      <OdooTopNav />
      <div className="o-empty" style={{ flex: 1 }}>
        <ShieldAlert style={{ width: 40, height: 40, color: '#DC3545' }} />
        <div className="o-empty-title">Accès refusé</div>
        <div className="o-empty-sub">Vous n'avez pas les permissions administrateur</div>
      </div>
    </div>
  );

  const res = data.res;
  const total = res.length;
  const confirmed = res.filter(r => r.statut === 'confirmee').length;
  const pending = res.filter(r => r.statut === 'en_attente').length;
  const cancelled = res.filter(r => r.statut === 'annulee').length;
  const amount = res.filter(r => r.statut !== 'annulee').reduce((s, r) => s + (r.montant_total ?? 0), 0);

  // 7-day trend
  const trend = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStr = format(d, 'yyyy-MM-dd');
    const dayRes = res.filter(r => r.created_at?.startsWith(dayStr));
    return {
      date: format(d, 'dd/MM'),
      total: dayRes.length,
      confirmed: dayRes.filter(r => r.statut === 'confirmee').length,
      pending: dayRes.filter(r => r.statut === 'en_attente').length,
    };
  });

  // By status
  const byStatus = [
    { name: 'Confirmée', value: confirmed, fill: '#28A745' },
    { name: 'En attente', value: pending, fill: '#E9A800' },
    { name: 'Annulée', value: cancelled, fill: '#DC3545' },
  ];

  // By type
  const byType = Object.entries(
    res.reduce((acc, r) => { const t = r.type_evenement ?? 'autre'; acc[t] = (acc[t] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name: (EVENT_ICONS[name] ?? '') + ' ' + name, count }));

  // Top halls
  const topHalls = data.salles.sort((a, b) => (b.nb_avis ?? 0) - (a.nb_avis ?? 0)).slice(0, 5);

  const KPIS = [
    { label: 'Total réservations', val: total, color: '#714B67', cls: 'purple' },
    { label: 'Confirmées', val: confirmed, color: '#28A745', cls: 'green' },
    { label: 'En attente', val: pending, color: '#E9A800', cls: 'amber' },
    { label: 'Revenu total', val: amount.toLocaleString('fr-DZ') + ' DA', color: '#0078BF', cls: 'blue' },
  ];

  const COLS = '28px 1fr 90px 90px 100px';

  return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />

      <div className="o-actionbar">
        <div className="o-breadcrumb">
          <span className="o-breadcrumb-current">Analytique administration</span>
        </div>
        <select className="o-btn o-btn-secondary" style={{ cursor: 'pointer', fontSize: 12 }}>
          {['Ce mois', '3 derniers mois', 'Cette année'].map(p => <option key={p}>{p}</option>)}
        </select>
        <button className="o-btn o-btn-secondary">Exporter PDF</button>
      </div>

      <div className="o-content o-dashboard">
        {/* KPI Grid */}
        <div className="o-kpi-grid">
          {KPIS.map(k => (
            <div key={k.label} className={`o-kpi-card ${k.cls}`}>
              <div className="o-kpi-label">{k.label}</div>
              <div className="o-kpi-val" style={{ color: k.color }}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {/* Trend */}
          <div className="o-chart-card">
            <div className="o-chart-head">
              <div className="o-chart-title">Activité — 7 derniers jours</div>
            </div>
            <AdminTrendChart data={trend} />
          </div>

          {/* By Status */}
          <div className="o-chart-card">
            <div className="o-chart-head">
              <div className="o-chart-title">Par statut</div>
            </div>
            {total > 0 ? (
              <AdminStatusPieChart data={byStatus} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#AAAAAA', fontSize: 12 }}>
                Aucune donnée
              </div>
            )}
          </div>
        </div>

        {/* By Event Type */}
        <div className="o-chart-card">
          <div className="o-chart-head">
            <div className="o-chart-title">Réservations par type d&apos;événement</div>
          </div>
          {byType.length > 0 ? (
            <AdminEventTypeChart data={byType} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: '#AAAAAA' }}>
              Aucune donnée
            </div>
          )}
        </div>

        {/* Top Halls */}
        <div className="o-chart-card" style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F0F0', fontSize: 13, fontWeight: 600, color: '#212529' }}>
            Salles les plus appréciées
          </div>
          {topHalls.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#AAAAAA', fontSize: 12 }}>Aucune salle</div>
          ) : (
            <div className="o-list">
              <div className="o-list-header" style={{ gridTemplateColumns: COLS }}>
                <div /><div className="o-list-header-cell">Nom</div>
                <div className="o-list-header-cell">Note</div><div className="o-list-header-cell">Avis</div>
                <div className="o-list-header-cell">Disponible</div>
              </div>
              {topHalls.map(h => (
                <div key={h.id} className="o-list-row" style={{ gridTemplateColumns: COLS }}>
                  <div />
                  <div className="o-cell" style={{ fontWeight: 500 }}>{h.nom}</div>
                  <div className="o-cell">★ {h.note_moyenne}</div>
                  <div className="o-cell">{h.nb_avis ?? 0}</div>
                  <div className="o-cell">
                    <span className={`o-badge ${h.is_available ? 'o-badge-conf' : 'o-badge-wait'}`} style={{ fontSize: 10 }}>
                      {h.is_available ? 'Oui' : 'Non'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Reservations */}
        <div className="o-chart-card" style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F0F0', fontSize: 13, fontWeight: 600 }}>
            Dernières réservations
          </div>
          {res.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#AAAAAA', fontSize: 12 }}>Aucune réservation</div>
          ) : (
            <div className="o-list">
              <div className="o-list-header" style={{ gridTemplateColumns: '120px 1fr 100px 90px 100px 160px' }}>
                <div className="o-list-header-cell">Réf.</div><div className="o-list-header-cell">Salle</div>
                <div className="o-list-header-cell">Type</div><div className="o-list-header-cell">Date</div>
                <div className="o-list-header-cell">Statut</div><div className="o-list-header-cell">Actions</div>
              </div>
              {res.slice(0, 10).map((r, i) => (
                <div key={r.id} className="o-list-row" style={{ gridTemplateColumns: '120px 1fr 100px 90px 100px 160px', height: 'auto', padding: '8px 16px' }}>
                  <div className="o-cell" style={{ fontSize: 11, fontWeight: 500 }}>#{String(i + 1).padStart(4, '0')}</div>
                  <div className="o-cell" style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>{r.salle?.nom ?? '—'}</div>
                  <div className="o-cell"><span style={{ fontSize: 11 }}>{EVENT_ICONS[r.type_evenement ?? 'autre']}</span></div>
                  <div className="o-cell o-cell-muted" style={{ fontSize: 11 }}>
                    {format(parseISO(r.date_debut), 'dd MMM yy', { locale: fr })}
                  </div>
                  <div className="o-cell">
                    <span className={`o-badge ${r.statut === 'confirmee' ? 'o-badge-conf' : r.statut === 'en_attente' ? 'o-badge-wait' : 'o-badge-cancel'}`} style={{ fontSize: 10 }}>
                      {r.statut === 'confirmee' ? 'Confirmée' : r.statut === 'en_attente' ? 'En attente' : 'Annulée'}
                    </span>
                  </div>
                  <div className="o-cell" style={{ overflow: 'visible' }}>
                    {r.statut === 'en_attente' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="o-btn o-btn-primary o-btn-sm" onClick={() => requestStatusChange(r.id, 'confirmee', r.salle?.nom ?? '')}>
                          ✓ Confirmer
                        </button>
                        <button className="o-btn o-btn-danger o-btn-sm" onClick={() => requestStatusChange(r.id, 'annulee', r.salle?.nom ?? '')}>
                          ✕ Refuser
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RLS Notice */}
        <div style={{ background: '#F3EFF2', border: '1px solid #D4C3D0', borderRadius: 4, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#714B67" strokeWidth="2" style={{ marginTop: 1, flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p style={{ fontSize: 11, color: '#5E3D56', lineHeight: 1.6 }}>
            <strong>Architecture RLS :</strong> Cette page est protégée — seuls les admins (role='admin') y ont accès via les politiques Row-Level Security de Supabase PostgreSQL.
          </p>
        </div>

        {/* Issue #12: Custom confirm dialog */}
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
    </div>
  );
}
