'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OdooTopNav from '@/components/OdooTopNav';
import SubNav from '@/components/SubNav';
import { createClient } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { Loader2, User } from 'lucide-react';
import { SkeletonForm } from '@/components/SkeletonLoader';

const TABS = [
  { label: 'Tableau de bord', href: '/dashboard' },
  { label: 'Mon Profil', href: '/profile' },
];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      // Issue #17: Get email directly from auth
      setEmail(user.email ?? '');
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) {
        setProfile(prof as Profile);
        setForm(prof as Profile);
      }
      setLoading(false);
    })();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name,
        phone: form.phone,
        wilaya: form.wilaya,
      }).eq('id', profile.id);

      if (error) throw error;
      alert("Profil mis à jour avec succès !");
      setProfile({ ...profile, ...form } as Profile);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour du profil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />
      <div className="o-content"><SkeletonForm /></div>
    </div>
  );

  return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />

      <div className="o-actionbar">
        <div className="o-breadcrumb">
          <span className="o-breadcrumb-current">Paramètres du profil</span>
        </div>
      </div>

      <div className="o-content o-form">
        <div className="o-form-body" style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F3EFF2', color: '#714B67', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold' }}>
              {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 style={{ fontSize: 24, margin: 0, color: '#333' }}>{profile?.full_name}</h1>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: profile?.role === 'admin' ? '#FDECEA' : profile?.role === 'owner' ? '#E3F2FD' : '#EBF6EC',
                  color: profile?.role === 'admin' ? '#DC3545' : profile?.role === 'owner' ? '#0D47A1' : '#1B5E20',
                  padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '.03em'
                }}>
                  {profile?.role === 'admin' ? '🛡️ Administrateur' : profile?.role === 'owner' ? '🏢 Propriétaire' : '👤 Client'}
                </span>
              </div>
            </div>
          </div>

          <div className="o-divider" style={{ margin: '24px 0' }} />

          <form onSubmit={handleSave}>
            {/* Issue #17: Email from auth (read-only) */}
            <div className="o-form-group full">
              <label className="o-field-label">Adresse email</label>
              <input className="o-input" value={email} disabled style={{ background: '#F0F0F0', color: '#888', cursor: 'not-allowed' }} />
              <span style={{ fontSize: 10, color: '#aaa', marginTop: 4, display: 'block' }}>L&apos;email est lié à votre compte et ne peut pas être modifié ici.</span>
            </div>
            <div className="o-form-group full" style={{ marginTop: 16 }}>
              <label className="o-field-label">Nom complet</label>
              <input
                className="o-input"
                value={form.full_name || ''}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
            <div className="o-form-group full" style={{ marginTop: 16 }}>
              <label className="o-field-label">Téléphone</label>
              <input
                className="o-input"
                value={form.phone || ''}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="o-form-group full" style={{ marginTop: 16 }}>
              <label className="o-field-label">Wilaya</label>
              <input
                className="o-input"
                value={form.wilaya || ''}
                onChange={e => setForm({ ...form, wilaya: e.target.value })}
              />
            </div>

            <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
              <button type="submit" className="o-btn o-btn-primary" disabled={saving}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
