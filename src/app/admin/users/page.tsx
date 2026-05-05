'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OdooTopNav from '@/components/OdooTopNav';
import SubNav from '@/components/SubNav';
import ConfirmDialog from '@/components/ConfirmDialog';
import { createClient } from '@/lib/supabase';
import type { Profile, UserRole } from '@/lib/types';
import { ShieldAlert, Users, ChevronDown } from 'lucide-react';
import { SkeletonList } from '@/components/SkeletonLoader';

const TABS = [
  { label: 'Tableau de bord', href: '/dashboard' },
  { label: 'Gestion des salles', href: '/admin/salles' },
  { label: 'Utilisateurs', href: '/admin/users' },
  { label: 'Administration', href: '/admin' },
];

const ROLES: { value: UserRole; label: string; color: string; bg: string }[] = [
  { value: 'client', label: 'Client', color: '#1B5E20', bg: '#EBF6EC' },
  { value: 'owner', label: 'Propriétaire', color: '#0D47A1', bg: '#E3F2FD' },
  { value: 'admin', label: 'Administrateur', color: '#DC3545', bg: '#FDECEA' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<{ id: string; role: UserRole; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      const prof = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (prof.data?.role !== 'admin') { router.push('/dashboard'); return; }
      setRole('admin');

      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setProfiles(data ?? []);
      setLoading(false);
    })();
  }, []);

  const changeRole = async () => {
    if (!pendingRole) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ role: pendingRole.role }).eq('id', pendingRole.id);
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === pendingRole.id ? { ...p, role: pendingRole.role } : p));
    } else {
      alert('Erreur lors de la mise à jour du rôle: ' + error.message);
    }
    setPendingRole(null);
    setEditingId(null);
    setSaving(false);
  };

  const filtered = profiles.filter(p =>
    !search || `${p.full_name} ${p.role} ${p.wilaya}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />
      <div className="o-actionbar">
        <div className="o-breadcrumb">
          <span className="o-breadcrumb-current">Gestion des utilisateurs</span>
        </div>
      </div>
      <div className="o-content">
        <SkeletonList rows={8} cols={5} />
      </div>
    </div>
  );

  if (!role) return (
    <div className="o-app">
      <OdooTopNav />
      <div className="o-empty" style={{ flex: 1 }}>
        <ShieldAlert style={{ width: 40, height: 40, color: '#DC3545' }} />
        <div className="o-empty-title">Accès refusé</div>
        <div className="o-empty-sub">Vous n&apos;avez pas les permissions administrateur</div>
      </div>
    </div>
  );

  return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />

      <div className="o-actionbar">
        <div className="o-breadcrumb">
          <span className="o-breadcrumb-current">Gestion des utilisateurs</span>
        </div>
        <span style={{ fontSize: 12, color: '#888' }}>
          <Users style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          {profiles.length} utilisateur{profiles.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="o-searchbar">
        <div className="o-search-input">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#AAAAAA" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="o-search-field"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="o-viewbar">
        <span className="o-records-count">{filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}</span>
      </div>

      <div className="o-content">
        {filtered.length === 0 ? (
          <div className="o-empty" style={{ padding: 48 }}>
            <Users className="o-empty-icon" style={{ width: 40, height: 40 }} />
            <div className="o-empty-title">Aucun utilisateur trouvé</div>
            <div className="o-empty-sub">Modifiez votre recherche</div>
          </div>
        ) : (
          <div className="o-list">
            <div className="o-list-header" style={{ gridTemplateColumns: '1fr 120px 120px 140px 160px' }}>
              <div className="o-list-header-cell">Nom complet</div>
              <div className="o-list-header-cell">Téléphone</div>
              <div className="o-list-header-cell">Wilaya</div>
              <div className="o-list-header-cell">Rôle actuel</div>
              <div className="o-list-header-cell">Changer le rôle</div>
            </div>
            {filtered.map(p => {
              const roleInfo = ROLES.find(r => r.value === p.role) ?? ROLES[0];
              return (
                <div key={p.id} className="o-list-row" style={{ gridTemplateColumns: '1fr 120px 120px 140px 160px' }}>
                  <div className="o-cell" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: roleInfo.bg, color: roleInfo.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>
                      {p.full_name?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                    <span style={{ fontWeight: 500 }}>{p.full_name}</span>
                  </div>
                  <div className="o-cell o-cell-muted">{p.phone ?? '—'}</div>
                  <div className="o-cell o-cell-muted">{p.wilaya ?? '—'}</div>
                  <div className="o-cell">
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 10px', borderRadius: 12,
                      fontSize: 11, fontWeight: 600,
                      background: roleInfo.bg, color: roleInfo.color,
                    }}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <div className="o-cell" style={{ overflow: 'visible' }}>
                    {editingId === p.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {ROLES.filter(r => r.value !== p.role).map(r => (
                          <button
                            key={r.value}
                            className="o-btn o-btn-secondary o-btn-sm"
                            style={{ fontSize: 10, padding: '2px 8px' }}
                            onClick={() => {
                              setPendingRole({ id: p.id, role: r.value, name: p.full_name });
                              setEditingId(null);
                            }}
                          >
                            {r.label}
                          </button>
                        ))}
                        <button
                          className="o-btn o-btn-sm"
                          style={{ fontSize: 10, padding: '2px 6px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                          onClick={() => setEditingId(null)}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        className="o-btn o-btn-secondary o-btn-sm"
                        style={{ fontSize: 11 }}
                        onClick={() => setEditingId(p.id)}
                      >
                        <ChevronDown style={{ width: 12, height: 12 }} /> Modifier
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingRole}
        title="Changer le rôle"
        message={pendingRole ? `Voulez-vous changer le rôle de "${pendingRole.name}" en "${ROLES.find(r => r.value === pendingRole.role)?.label}" ?` : ''}
        confirmLabel={saving ? 'Enregistrement...' : 'Confirmer'}
        onConfirm={changeRole}
        onCancel={() => { setPendingRole(null); setEditingId(null); }}
        danger={false}
      />
    </div>
  );
}
