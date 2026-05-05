'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OdooTopNav from '@/components/OdooTopNav';
import SubNav from '@/components/SubNav';
import ConfirmDialog from '@/components/ConfirmDialog';
import ImageWithFallback from '@/components/ImageWithFallback';
import { createClient } from '@/lib/supabase';
import type { Salle } from '@/lib/types';
import { Loader2, ShieldAlert, Plus, Pencil, Trash2, X, Save, Building2 } from 'lucide-react';
import { SkeletonList } from '@/components/SkeletonLoader';

const TABS = [
  { label: 'Tableau de bord', href: '/dashboard' },
  { label: 'Gestion des salles', href: '/admin/salles' },
  { label: 'Administration', href: '/admin' },
];

const WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
  'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou',
  'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba',
  'Guelma', 'Constantine', 'Médéa', 'Mostaganem', "M'Sila", 'Mascara', 'Ouargla',
  'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf',
  'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila',
  'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane',
];

type SalleForm = {
  nom: string;
  description: string;
  ville: string;
  wilaya: string;
  capacite: number;
  prix_par_jour: number;
  image_url: string;
  adresse: string;
  telephone: string;
  amenities: string;
  is_available: boolean;
};

const emptyForm: SalleForm = {
  nom: '', description: '', ville: '', wilaya: 'Alger', capacite: 100,
  prix_par_jour: 50000, image_url: '', adresse: '', telephone: '',
  amenities: '', is_available: true,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 13,
  border: '1.5px solid #E0E0E0', borderRadius: 6, outline: 'none',
  background: '#FAFAFA', fontFamily: 'inherit', color: '#212529',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#555',
  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5,
};

export default function AdminSallesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [salles, setSalles] = useState<Salle[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SalleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nom: string } | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      const prof = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (prof.data?.role !== 'admin') { router.push('/dashboard'); return; }
      setRole('admin');

      const { data } = await supabase.from('salles').select('*').order('created_at', { ascending: false });
      setSalles(data ?? []);
      setLoading(false);
    })();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (salle: Salle) => {
    setEditId(salle.id);
    setForm({
      nom: salle.nom,
      description: salle.description ?? '',
      ville: salle.ville,
      wilaya: salle.wilaya,
      capacite: salle.capacite,
      prix_par_jour: salle.prix_par_jour,
      image_url: salle.image_url ?? '',
      adresse: salle.adresse ?? '',
      telephone: salle.telephone ?? '',
      amenities: (salle.amenities ?? []).join(', '),
      is_available: salle.is_available,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim() || !form.ville.trim()) {
      alert('Le nom et la ville sont obligatoires.');
      return;
    }
    setSaving(true);
    const payload = {
      nom: form.nom,
      description: form.description || null,
      ville: form.ville,
      wilaya: form.wilaya,
      capacite: form.capacite,
      prix_par_jour: form.prix_par_jour,
      image_url: form.image_url || null,
      adresse: form.adresse || null,
      telephone: form.telephone || null,
      amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
      is_available: form.is_available,
    };

    try {
      // Get the current user ID to set as owner_id
      const { data: { user } } = await supabase.auth.getUser();
      const finalPayload = { ...payload, owner_id: user?.id || null };

      if (editId) {
        const { error } = await supabase.from('salles').update(finalPayload).eq('id', editId);
        if (error) throw error;
        setSalles(prev => prev.map(s => s.id === editId ? { ...s, ...finalPayload } as Salle : s));
      } else {
        const { data, error } = await supabase.from('salles').insert([finalPayload]).select().single();
        if (error) throw error;
        setSalles(prev => [data as Salle, ...prev]);
      }
      setModalOpen(false);
    } catch (err: any) {
      console.error('Save error details:', err);
      alert(`Erreur lors de la sauvegarde: ${err.message || JSON.stringify(err)}`);
    } finally {
      setSaving(false);
    }
  };

  // Issue #7: Check for active reservations before deleting
  const handleDeleteRequest = async (salle: Salle) => {
    setDeleteError('');
    const { count } = await supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('salle_id', salle.id)
      .in('statut', ['en_attente', 'confirmee']);
    if (count && count > 0) {
      setDeleteError(`Impossible de supprimer "${salle.nom}" : ${count} réservation${count > 1 ? 's' : ''} active${count > 1 ? 's' : ''}. Annulez-les d'abord.`);
      return;
    }
    setConfirmDelete({ id: salle.id, nom: salle.nom });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.id);
    try {
      const { error } = await supabase.from('salles').delete().eq('id', confirmDelete.id);
      if (error) throw error;
      setSalles(prev => prev.filter(s => s.id !== confirmDelete.id));
    } catch (err) {
      console.error(err);
      setDeleteError('Erreur lors de la suppression.');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  if (loading) return (
    <div className="o-app">
      <OdooTopNav />
      <SubNav tabs={TABS} />
      <div className="o-actionbar"><div className="o-breadcrumb"><span className="o-breadcrumb-current">Gestion des salles des fêtes</span></div></div>
      <div className="o-content"><SkeletonList rows={6} cols={5} /></div>
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
          <span className="o-breadcrumb-current">Gestion des salles des fêtes</span>
        </div>
        <button className="o-btn o-btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Plus style={{ width: 14, height: 14 }} />
          Nouvelle salle
        </button>
      </div>

      <div className="o-viewbar">
        <span className="o-records-count">{salles.length} salle{salles.length > 1 ? 's' : ''}</span>
      </div>

      <div className="o-content">
        {salles.length === 0 ? (
          <div className="o-empty" style={{ padding: 48 }}>
            <Building2 className="o-empty-icon" style={{ width: 40, height: 40 }} />
            <div className="o-empty-title">Aucune salle</div>
            <div className="o-empty-sub">Créez votre première salle des fêtes</div>
            <button className="o-btn o-btn-primary" onClick={openCreate}>Créer une salle</button>
          </div>
        ) : (
          <div className="o-list">
            <div className="o-list-header" style={{ gridTemplateColumns: '1fr 100px 80px 110px 90px 130px' }}>
              <div className="o-list-header-cell">Nom de la salle</div>
              <div className="o-list-header-cell">Wilaya</div>
              <div className="o-list-header-cell">Capacité</div>
              <div className="o-list-header-cell">Prix/jour</div>
              <div className="o-list-header-cell">Statut</div>
              <div className="o-list-header-cell">Actions</div>
            </div>
            {salles.map(salle => (
              <div key={salle.id} className="o-list-row" style={{ gridTemplateColumns: '1fr 100px 80px 110px 90px 130px' }}>
                <div className="o-cell" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {salle.image_url && (
                    <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      <ImageWithFallback src={salle.image_url} alt={salle.nom} fallbackText={salle.nom} fill style={{ objectFit: 'cover' }} sizes="36px" />
                    </div>
                  )}
                  <Link href={`/halls/${salle.id}`} style={{ color: '#017E84', fontWeight: 500, textDecoration: 'none' }}>{salle.nom}</Link>
                </div>
                <div className="o-cell">{salle.wilaya}</div>
                <div className="o-cell">{salle.capacite}</div>
                <div className="o-cell" style={{ fontWeight: 600, color: '#714B67' }}>{salle.prix_par_jour.toLocaleString('fr-DZ')} DA</div>
                <div className="o-cell">
                  <span className={`o-badge ${salle.is_available ? 'o-badge-conf' : 'o-badge-cancel'}`} style={{ fontSize: 10 }}>
                    {salle.is_available ? 'Dispo' : 'Indispo'}
                  </span>
                </div>
                <div className="o-cell" style={{ display: 'flex', gap: 6, overflow: 'visible' }}>
                  <button className="o-btn o-btn-secondary o-btn-sm" onClick={() => openEdit(salle)} title="Modifier">
                    <Pencil style={{ width: 12, height: 12 }} /> Modifier
                  </button>
                  <button
                    className="o-btn o-btn-danger o-btn-sm"
                    onClick={() => handleDeleteRequest(salle)}
                    disabled={deleting === salle.id}
                    title="Supprimer"
                  >
                    {deleting === salle.id ? <Loader2 className="o-spin" style={{ width: 12, height: 12 }} /> : <Trash2 style={{ width: 12, height: 12 }} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Create/Edit */}
      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          animation: 'o-fade-in 0.2s ease',
        }} onClick={() => setModalOpen(false)}>
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 640,
            maxHeight: '90vh', overflow: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,.25)',
            animation: 'o-slide-in-up 0.3s cubic-bezier(0.4,0,0.2,1)',
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid #eee',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #F8F9FC 0%, #F5F5F5 100%)',
              borderRadius: '12px 12px 0 0',
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#212529', margin: 0 }}>
                {editId ? 'Modifier la salle' : 'Nouvelle salle des fêtes'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nom de la salle *</label>
                  <input style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Palais des Lumières" />
                </div>
                <div>
                  <label style={labelStyle}>Ville *</label>
                  <input style={inputStyle} value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} placeholder="Ex: Alger" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Wilaya</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.wilaya} onChange={e => setForm({ ...form, wilaya: e.target.value })}>
                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Capacité (invités)</label>
                  <input type="number" style={inputStyle} value={form.capacite} onChange={e => setForm({ ...form, capacite: parseInt(e.target.value) || 0 })} min={1} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Prix par jour (DA)</label>
                  <input type="number" style={inputStyle} value={form.prix_par_jour} onChange={e => setForm({ ...form, prix_par_jour: parseInt(e.target.value) || 0 })} min={0} />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input style={inputStyle} value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="023 XX XX XX" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Adresse</label>
                <input style={inputStyle} value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} placeholder="Adresse complète" />
              </div>

              <div>
                <label style={labelStyle}>URL de l&apos;image</label>
                <input style={inputStyle} value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://images.unsplash.com/..." />
                {form.image_url && (
                  <div style={{ marginTop: 8, position: 'relative', height: 120, borderRadius: 6, overflow: 'hidden' }}>
                    <ImageWithFallback src={form.image_url} alt="Aperçu" fallbackText="A" fill style={{ objectFit: 'cover' }} sizes="600px" />
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={{ ...inputStyle, height: 80, resize: 'none' } as React.CSSProperties}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Description de la salle..."
                />
              </div>

              <div>
                <label style={labelStyle}>Équipements (séparés par des virgules)</label>
                <input style={inputStyle} value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} placeholder="DJ & Sono, Traiteur, Parking, Climatisation" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="is_available"
                  checked={form.is_available}
                  onChange={e => setForm({ ...form, is_available: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#714B67' }}
                />
                <label htmlFor="is_available" style={{ fontSize: 13, color: '#333', cursor: 'pointer' }}>
                  Salle disponible à la réservation
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #eee',
              display: 'flex', justifyContent: 'flex-end', gap: 10,
              background: '#FAFAFA', borderRadius: '0 0 12px 12px',
            }}>
              <button className="o-btn o-btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
              <button className="o-btn o-btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving ? <Loader2 className="o-spin" style={{ width: 14, height: 14 }} /> : <Save style={{ width: 14, height: 14 }} />}
                {saving ? 'Sauvegarde...' : editId ? 'Mettre à jour' : 'Créer la salle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue #7: Delete error message */}
      {deleteError && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#FDECEA', border: '1px solid #FFCDD2', borderRadius: 8, padding: '12px 20px', boxShadow: '0 8px 24px rgba(0,0,0,.15)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, animation: 'o-slide-in-up 0.3s ease', maxWidth: 500 }}>
          <span style={{ fontSize: 13, color: '#C62828' }}>{deleteError}</span>
          <button onClick={() => setDeleteError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4 }}><X style={{ width: 14, height: 14 }} /></button>
        </div>
      )}

      {/* Issue #12: Custom confirm dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer la salle"
        message={confirmDelete ? `Êtes-vous sûr de vouloir supprimer "${confirmDelete.nom}" ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        danger={true}
      />
    </div>
  );
}
