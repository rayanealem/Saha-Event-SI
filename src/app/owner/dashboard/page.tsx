'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OdooTopNav from '@/components/OdooTopNav';
import SubNav from '@/components/SubNav';
import { createClient } from '@/lib/supabase';
import type { Reservation, Salle } from '@/lib/types';
import { ShieldAlert } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SkeletonPage } from '@/components/SkeletonLoader';

const AdminTrendChart = dynamic(() => import('@/components/Charts').then(m => ({ default: m.AdminTrendChart })), { ssr: false });
const AdminStatusPieChart = dynamic(() => import('@/components/Charts').then(m => ({ default: m.AdminStatusPieChart })), { ssr: false });

const TABS = [
  { label: 'Tableau de bord', href: '/dashboard' },
  { label: 'Mes salles', href: '/owner/salles' },
  { label: 'Réservations reçues', href: '/owner/reservations' },
  { label: 'Mon activité', href: '/owner/dashboard' },
];

const EVENT_ICONS: Record<string, string> = {
  mariage: '💍', anniversaire: '🎂', fiancailles: '💐', conference: '🎤', gala: '✨', autre: '🎉',
};

export default function OwnerDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [data, setData] = useState<{ res: Reservation[], salles: Salle[] }>({ res: [], salles: [] });
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      const prof = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (prof.data?.role !== 'owner') { router.push('/dashboard'); return; }
      setAuthorized(true);

      // Fetch owner's halls
      const { data: sallesData } = await supabase.from('salles').select('*').eq('owner_id', user.id);
      const ownerSalles = sallesData ?? [];

      // Fetch reservations for owner's halls
      const salleIds = ownerSalles.map(s => s.id);
      let resData: Reservation[] = [];
      if (salleIds.length > 0) {
        const { data: rData } = await supabase
          .from('reservations')
          .select('*, salle:salles(*)')
          .in('salle_id', salleIds)
          .order('created_at', { ascending: false });
        resData = (rData as Reservation[]) ?? [];
      }

      setData({ res: resData, salles: ownerSalles });
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />
      <div className="o-content"><SkeletonPage /></div>
    </div>
  );

  if (!authorized) return (
    <div className="o-app">
      <OdooTopNav />
      <div className="o-empty" style={{ flex: 1 }}>
        <ShieldAlert style={{ width: 40, height: 40, color: '#DC3545' }} />
        <div className="o-empty-title">Accès refusé</div>
        <div className="o-empty-sub">Cette page est réservée aux propriétaires de salles</div>
      </div>
    </div>
  );

  const res = data.res;
  const total = res.length;
  const confirmed = res.filter(r => r.statut === 'confirmee').length;
  const pending = res.filter(r => r.statut === 'en_attente').length;
  const cancelled = res.filter(r => r.statut === 'annulee').length;
  const revenue = res.filter(r => r.statut === 'confirmee' || r.statut === 'terminee').reduce((s, r) => s + (r.montant_total ?? 0), 0);

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

  const KPIS = [
    { label: 'Mes salles', val: data.salles.length, color: '#0D47A1', cls: 'blue' },
    { label: 'Total réservations', val: total, color: '#714B67', cls: 'purple' },
    { label: 'Confirmées', val: confirmed, color: '#28A745', cls: 'green' },
    { label: 'En attente', val: pending, color: '#E9A800', cls: 'amber' },
    { label: 'Revenu confirmé', val: revenue.toLocaleString('fr-DZ') + ' DA', color: '#0078BF', cls: 'blue' },
  ];

  return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />

      <div className="o-actionbar">
        <div className="o-breadcrumb">
          <span className="o-breadcrumb-current">🏢 Mon activité — Propriétaire</span>
        </div>
        <Link href="/owner/salles" className="o-btn o-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
          Ajouter une salle
        </Link>
      </div>

      <div className="o-content o-dashboard">
        {/* KPI Grid */}
        <div className="o-kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className={`o-kpi-card ${k.cls}`}
              style={{ animation: `o-slide-in-up 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 80}ms backwards` }}
            >
              <div className="o-kpi-label">{k.label}</div>
              <div className="o-kpi-val" style={{ color: k.color }}>{k.val}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div className="o-chart-card">
            <div className="o-chart-head">
              <div className="o-chart-title">Activité — 7 derniers jours</div>
            </div>
            <AdminTrendChart data={trend} />
          </div>
          <div className="o-chart-card">
            <div className="o-chart-head">
              <div className="o-chart-title">Réservations par statut</div>
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

        {/* My Halls */}
        <div className="o-chart-card" style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#212529' }}>Mes salles</div>
            <Link href="/owner/salles" className="o-btn o-btn-link o-btn-sm">Gérer →</Link>
          </div>
          {data.salles.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#AAAAAA', fontSize: 12 }}>
              Vous n&apos;avez pas encore de salle. <Link href="/owner/salles" style={{ color: '#0D47A1', fontWeight: 600 }}>Créer une salle →</Link>
            </div>
          ) : (
            <div className="o-list">
              <div className="o-list-header" style={{ gridTemplateColumns: '1fr 100px 100px 90px' }}>
                <div className="o-list-header-cell">Nom</div>
                <div className="o-list-header-cell">Wilaya</div>
                <div className="o-list-header-cell">Prix/jour</div>
                <div className="o-list-header-cell">Disponible</div>
              </div>
              {data.salles.map(h => (
                <div key={h.id} className="o-list-row" style={{ gridTemplateColumns: '1fr 100px 100px 90px' }}>
                  <Link href={`/halls/${h.id}`} className="o-cell o-cell-link">{h.nom}</Link>
                  <div className="o-cell">{h.wilaya}</div>
                  <div className="o-cell" style={{ fontWeight: 600, color: '#714B67' }}>{h.prix_par_jour.toLocaleString('fr-DZ')} DA</div>
                  <div className="o-cell">
                    <span className={`o-badge ${h.is_available ? 'o-badge-conf' : 'o-badge-cancel'}`} style={{ fontSize: 10 }}>
                      {h.is_available ? 'Oui' : 'Non'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Reservations */}
        <div className="o-chart-card" style={{ padding: 0, marginTop: 10 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Dernières réservations reçues</div>
            <Link href="/owner/reservations" className="o-btn o-btn-link o-btn-sm">Voir tout →</Link>
          </div>
          {res.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#AAAAAA', fontSize: 12 }}>Aucune réservation reçue</div>
          ) : (
            <div className="o-list">
              <div className="o-list-header" style={{ gridTemplateColumns: '1fr 100px 90px 100px' }}>
                <div className="o-list-header-cell">Salle</div>
                <div className="o-list-header-cell">Type</div>
                <div className="o-list-header-cell">Date</div>
                <div className="o-list-header-cell">Statut</div>
              </div>
              {res.slice(0, 8).map(r => (
                <div key={r.id} className="o-list-row" style={{ gridTemplateColumns: '1fr 100px 90px 100px' }}>
                  <div className="o-cell" style={{ fontWeight: 500 }}>{r.salle?.nom ?? '—'}</div>
                  <div className="o-cell"><span style={{ fontSize: 11 }}>{EVENT_ICONS[r.type_evenement ?? 'autre']}</span></div>
                  <div className="o-cell o-cell-muted" style={{ fontSize: 11 }}>
                    {format(parseISO(r.date_debut), 'dd MMM yy', { locale: fr })}
                  </div>
                  <div className="o-cell">
                    <span className={`o-badge ${r.statut === 'confirmee' ? 'o-badge-conf' : r.statut === 'en_attente' ? 'o-badge-wait' : 'o-badge-cancel'}`} style={{ fontSize: 10 }}>
                      {r.statut === 'confirmee' ? 'Confirmée' : r.statut === 'en_attente' ? 'En attente' : r.statut === 'annulee' ? 'Annulée' : 'Terminée'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scope Notice */}
        <div style={{ background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: 4, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#0D47A1" strokeWidth="2" style={{ marginTop: 1, flexShrink: 0 }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <p style={{ fontSize: 11, color: '#0D47A1', lineHeight: 1.6 }}>
            <strong>Espace Propriétaire :</strong> Vous ne voyez que les données de vos propres salles. Les politiques RLS Supabase garantissent l&apos;isolation de vos données.
          </p>
        </div>
      </div>
    </div>
  );
}
