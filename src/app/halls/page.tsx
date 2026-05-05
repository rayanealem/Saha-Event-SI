'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import OdooTopNav from '@/components/OdooTopNav';
import WebsiteNav from '@/components/WebsiteNav';
import SubNav from '@/components/SubNav';
import ImageWithFallback from '@/components/ImageWithFallback';
import { createClient } from '@/lib/supabase';
import type { Salle } from '@/lib/types';
import { Building2, Search, SlidersHorizontal, ChevronLeft, ChevronRight, Plus, LayoutGrid, List } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { SkeletonCards, SkeletonList } from '@/components/SkeletonLoader';

export const dynamic = 'force-dynamic';

const ADMIN_TABS = [
  { label: 'Salles des fêtes', href: '/halls' },
  { label: 'Réservations',     href: '/dashboard/reservations' },
  { label: 'Analytique',       href: '/admin' },
];

const OWNER_TABS = [
  { label: 'Salles des fêtes', href: '/halls' },
  { label: 'Mes salles',       href: '/owner/salles' },
  { label: 'Mon activité',     href: '/owner/dashboard' },
];

const CLIENT_TABS = [
  { label: 'Salles des fêtes', href: '/halls' },
  { label: 'Réservations',     href: '/dashboard/reservations' },
];

const COLS = '28px 1fr 110px 90px 100px 80px 110px';
const PAGE_SIZE = 12;

export default function HallsPage() {
  const supabase = createClient();
  const [salles, setSalles] = useState<Salle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listView, setListView] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userRole, setUserRole] = useState('client');
  const [page, setPage] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setIsLoggedIn(!!data.user);
      setAuthChecked(true);
      if (data.user) {
        const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        if (prof?.role) setUserRole(prof.role);
      }
    });
  }, [supabase]);

  useEffect(() => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from('salles').select('*', { count: 'exact' })
      .order('note_moyenne', { ascending: false });

    if (debouncedSearch) {
      query = query.or(`nom.ilike.%${debouncedSearch}%,ville.ilike.%${debouncedSearch}%,wilaya.ilike.%${debouncedSearch}%`);
    }

    query.range(from, to).then(({ data, count }) => {
      setSalles(data ?? []);
      setTotalCount(count ?? 0);
      setLoading(false);
    });
  }, [debouncedSearch, page, supabase]);

  useEffect(() => { setPage(0); }, [debouncedSearch]);

  const toggleSelect = (id: string) => {
    setSelected(prev => { 
      const n = new Set(prev); 
      n.has(id) ? n.delete(id) : n.add(id); 
      return n; 
    });
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const showAsCards = !isLoggedIn || !listView;

  return (
    <div className="o-app bg-[#F9FAFB] min-h-screen">
      {authChecked && (isLoggedIn ? <OdooTopNav /> : <WebsiteNav />)}
      {isLoggedIn && <SubNav tabs={userRole === 'admin' ? ADMIN_TABS : userRole === 'owner' ? OWNER_TABS : CLIENT_TABS} />}

      {/* Header section */}
      {isLoggedIn ? (
        <div className="o-actionbar">
          <div className="o-breadcrumb">
            <span className="o-breadcrumb-current">Salles des fêtes</span>
          </div>
          <div className="flex gap-2">
            <Link href={userRole === 'admin' ? '/admin/salles' : '/owner/salles'} className="o-btn o-btn-primary flex items-center gap-2">
              <Plus size={16} /> Nouvelle salle
            </Link>
            <button className="o-btn o-btn-secondary">Actions ▾</button>
          </div>
        </div>
      ) : (
        authChecked && (
          <header className="max-w-6xl mx-auto pt-16 pb-10 text-center px-4">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Salles des fêtes en Algérie</h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Réservez la salle parfaite pour votre mariage ou événement. Parcourez les meilleures options partout en Algérie.
            </p>
          </header>
        )
      )}

      {/* Search & Filter Bar */}
      <div className="o-searchbar" style={!isLoggedIn ? { maxWidth: 1100, margin: '0 auto', border: 'none', background: 'transparent' } : {}}>
        <div className="o-search-input bg-white border shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input
            className="o-search-field"
            placeholder="Rechercher par nom, ville ou wilaya..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="o-search-pill bg-white border shadow-sm hover:bg-slate-50">
          <SlidersHorizontal size={14} /> Filtres
        </button>
      </div>

      {/* View controls for logged-in users */}
      {isLoggedIn && (
        <div className="o-viewbar">
          <div className="flex items-center gap-4">
            <div className="o-view-toggle">
              <button className={`o-view-btn ${listView ? 'active' : ''}`} onClick={() => setListView(true)}><List size={16}/></button>
              <button className={`o-view-btn ${!listView ? 'active' : ''}`} onClick={() => setListView(false)}><LayoutGrid size={16}/></button>
            </div>
            <span className="text-sm font-medium text-slate-500">{totalCount} résultats</span>
          </div>
          <div className="o-pager">
            <span className="text-sm text-slate-600 font-medium">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} / {totalCount}</span>
            <button className="o-pager-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={18}/></button>
            <button className="o-pager-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight size={18}/></button>
          </div>
        </div>
      )}

      <div className="o-content" style={!isLoggedIn ? { maxWidth: 1100, margin: '0 auto' } : {}}>
        {loading ? (
          showAsCards ? <SkeletonCards count={8} /> : <SkeletonList rows={10} cols={6} />
        ) : salles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-60">
            <Building2 size={64} className="text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Aucune salle trouvée</h3>
            <p className="text-slate-500">Essayez d'ajuster vos critères de recherche.</p>
          </div>
        ) : showAsCards ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {salles.map(salle => (
              <Link key={salle.id} href={`/halls/${salle.id}`} className="group flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                {/* SHARP IMAGE CONTAINER */}
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <ImageWithFallback 
                    src={salle.image_url ?? ''} 
                    alt={salle.nom} 
                    fallbackText={salle.nom} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    unoptimized={salle.image_url?.includes('google')} // Use full quality for Google URLs
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${salle.is_available ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
                      {salle.is_available ? 'Disponible' : 'Réservée'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-1">{salle.nom}</h3>
                    <div className="flex items-center text-amber-500 text-sm font-bold">
                      ★ {salle.note_moyenne}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                    📍 {salle.ville}, {salle.wilaya}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Prix par jour</span>
                      <span className="text-md font-black text-purple-900">{salle.prix_par_jour.toLocaleString('fr-DZ')} <small>DA</small></span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{salle.capacite} invités</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="o-list bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="o-list-header border-b bg-slate-50" style={{ gridTemplateColumns: COLS }}>
              <div className="flex items-center justify-center"><input type="checkbox" className="rounded" /></div>
              {['Nom de la salle', 'Wilaya', 'Capacité', 'Prix/jour', 'Note', 'Statut'].map(h => (
                <div key={h} className="o-list-header-cell font-bold text-slate-700 text-xs uppercase tracking-wider">{h}</div>
              ))}
            </div>
            {salles.map(salle => (
              <div key={salle.id} className={`o-list-row border-b last:border-0 hover:bg-slate-50/80 transition-colors ${selected.has(salle.id) ? 'bg-purple-50' : ''}`} style={{ gridTemplateColumns: COLS }}>
                <div className="flex items-center justify-center">
                  <input type="checkbox" checked={selected.has(salle.id)} onChange={() => toggleSelect(salle.id)} />
                </div>
                <Link href={`/halls/${salle.id}`} className="o-cell font-semibold text-slate-900 hover:text-purple-700">{salle.nom}</Link>
                <div className="o-cell text-slate-600">{salle.wilaya}</div>
                <div className="o-cell text-slate-600">{salle.capacite} pers.</div>
                <div className="o-cell font-bold text-purple-900">{salle.prix_par_jour.toLocaleString('fr-DZ')} DA</div>
                <div className="o-cell text-amber-500 font-bold">★ {salle.note_moyenne}</div>
                <div className="o-cell">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${salle.is_available ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {salle.is_available ? 'Libre' : 'Occupée'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination for Guests */}
      {!isLoggedIn && totalPages > 1 && (
        <div className="flex justify-center items-center py-16 gap-3">
          <button className="o-btn o-btn-secondary px-6" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Précédent</button>
          <div className="flex gap-1">
             {[...Array(totalPages)].map((_, i) => (
               <button 
                key={i} 
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-md text-sm font-bold transition-all ${page === i ? 'bg-purple-700 text-white' : 'hover:bg-slate-200 text-slate-600'}`}
               >
                 {i + 1}
               </button>
             ))}
          </div>
          <button className="o-btn o-btn-secondary px-6" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Suivant</button>
        </div>
      )}
    </div>
  );
}