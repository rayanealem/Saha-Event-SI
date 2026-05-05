'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import OdooTopNav from '@/components/OdooTopNav';
import WebsiteNav from '@/components/WebsiteNav';
import SubNav from '@/components/SubNav';
import ConfirmDialog from '@/components/ConfirmDialog';
import ImageWithFallback from '@/components/ImageWithFallback';
import { createClient } from '@/lib/supabase';
import type { Salle, SalleComment } from '@/lib/types';
import { Loader2, Building2, AlertTriangle, Printer, MessageSquare, Send, Trash2, MapPin, Users, Banknote, Phone, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SkeletonForm } from '@/components/SkeletonLoader';

const TABS = [
  { label: 'Salles des fêtes', href: '/halls' },
  { label: 'Réservations',     href: '/dashboard/reservations' },
];

const STEPS = ['Disponible', 'En cours', 'Réservée', 'Terminée'];

export default function HallDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [salle, setSalle] = useState<Salle | null>(null);
  const [comments, setComments] = useState<SalleComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string>('client');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Salle>>({});
  const [saving, setSaving] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [{ data: salleData }, { data: userData }] = await Promise.all([
          supabase.from('salles').select('*').eq('id', id).single(),
          supabase.auth.getUser(),
        ]);
        
        setSalle(salleData);
        setEditForm(salleData || {});
        setUser(userData.user);
        setIsLoggedIn(!!userData.user);

        if (userData.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userData.user.id)
            .single();
          if (profileData?.role) setUserRole(profileData.role);
        }

        const { data: commentsData } = await supabase
          .from('salle_comments')
          .select('*, user:profiles(*)')
          .eq('salle_id', id)
          .order('created_at', { ascending: false });
        
        setComments(commentsData || []);
      } catch (err) {
        console.error("Erreur chargement:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, supabase]);

  const handlePrint = () => window.print();

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from('salles').update({
        nom: editForm.nom,
        description: editForm.description,
        prix_par_jour: editForm.prix_par_jour,
        capacite: editForm.capacite,
        adresse: editForm.adresse,
        telephone: editForm.telephone,
      }).eq('id', id);

      if (error) throw error;
      setSalle(prev => prev ? { ...prev, ...editForm } as Salle : null);
      setIsEditing(false);
    } catch (err) {
      alert("Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    setCommenting(true);
    try {
      const { data, error } = await supabase.from('salle_comments').insert({
        salle_id: id,
        user_id: user.id,
        content: newComment,
      }).select('*, user:profiles(*)').single();

      if (error) throw error;
      if (data) {
        setComments([data, ...comments]);
        setNewComment('');
      }
    } catch (err) {
      alert("Erreur lors de l'ajout du commentaire.");
    } finally {
      setCommenting(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!deleteCommentId) return;
    try {
      await supabase.from('salle_comments').delete().eq('id', deleteCommentId);
      setComments(comments.filter(c => c.id !== deleteCommentId));
    } finally {
      setDeleteCommentId(null);
    }
  };

  if (loading) return (
    <div className="o-app">
      <WebsiteNav />
      <div className="o-content max-w-[900px] mx-auto"><SkeletonForm /></div>
    </div>
  );

  if (!salle) return (
    <div className="o-app">
      <WebsiteNav />
      <div className="o-empty flex-1">
        <Building2 size={40} className="text-slate-300 mb-4" />
        <div className="o-empty-title">Salle introuvable</div>
        <Link href="/halls" className="o-btn o-btn-primary mt-4">Retour aux salles</Link>
      </div>
    </div>
  );

  const canEdit = user && (userRole === 'admin' || user.id === salle.owner_id);

  return (
    <div className="o-app">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .o-topnav, .o-subnav, .o-actionbar, .o-chatter, .o-status-bar { display: none !important; }
          .o-content { padding: 0 !important; border: none !important; }
        }
      `}} />
      {isLoggedIn ? <OdooTopNav /> : <WebsiteNav />}
      {isLoggedIn && <SubNav tabs={TABS} />}

      <div className="o-actionbar">
        <div className="o-breadcrumb">
          <Link href="/halls" className="o-breadcrumb">Salles</Link>
          <span className="o-breadcrumb-sep">/</span>
          <span className="o-breadcrumb-current">{salle.nom}</span>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Link href={user ? `/reserve/${salle.id}` : `/auth?redirectTo=/reserve/${salle.id}`} className="o-btn o-btn-primary">
                {user ? 'Réserver maintenant' : 'Se connecter pour réserver'}
              </Link>
              {canEdit && <button className="o-btn o-btn-secondary" onClick={() => setIsEditing(true)}>Modifier</button>}
            </>
          ) : (
            <>
              <button className="o-btn o-btn-primary" onClick={handleSaveEdit} disabled={saving}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
              <button className="o-btn o-btn-secondary" onClick={() => setIsEditing(false)}>Annuler</button>
            </>
          )}
          <button className="o-btn o-btn-secondary flex items-center gap-2" onClick={handlePrint}><Printer size={14}/> Imprimer</button>
        </div>
      </div>

      <div className="o-form o-content">
        <div className="o-status-bar">
          {STEPS.map((step, i) => (
            <div key={step} className={`o-status-step ${i === 0 ? 'active' : ''}`}>{step}</div>
          ))}
        </div>

        <div className="o-form-body">
          {/* SHARPER IMAGE SECTION FIXED */}
          {salle.image_url && (
            <div style={{ 
              position: 'relative', 
              width: '30%',
              aspectRatio: '21 / 9', // Wider, more cinematic look for the detail page
              maxHeight: '400px',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '32px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#f1f5f9'
            }}>
              <ImageWithFallback 
                src={salle.image_url} 
                alt={salle.nom} 
                fallbackText={salle.nom} 
                fill 
                style={{ objectFit: 'cover', objectPosition: 'center' }} 
                priority 
                unoptimized={salle.image_url.includes('google')} // CRITICAL: Fixes blur for Google URLs
                sizes="(max-width: 1200px) 100vw, 1200px" 
              />
            </div>
          )}

          {!salle.is_available && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-amber-800 text-sm">
              <AlertTriangle size={18} className="text-amber-500" />
              <div><strong>Salle indisponible :</strong> Elle n&apos;accepte pas de nouvelles réservations pour le moment.</div>
            </div>
          )}

          <div className="o-form-section">Détails de l&apos;établissement</div>
          <div className="o-form-grid">
            <div className="o-form-group">
              <label className="o-field-label">Nom de la salle</label>
              {isEditing ? <input className="o-input" value={editForm.nom || ''} onChange={e => setEditForm({...editForm, nom: e.target.value})} /> : <div className="text-2xl font-black text-slate-900">{salle.nom}</div>}
            </div>
            <div className="o-form-group">
              <label className="o-field-label flex items-center gap-2"><MapPin size={13}/> Localisation</label>
              {isEditing ? <input className="o-input" value={editForm.adresse || ''} onChange={e => setEditForm({...editForm, adresse: e.target.value})} /> : <div className="o-field-value text-slate-700">{salle.adresse ?? `${salle.ville}, ${salle.wilaya}`}</div>}
            </div>
            <div className="o-form-group">
              <label className="o-field-label flex items-center gap-2"><Users size={13}/> Capacité</label>
              {isEditing ? <input type="number" className="o-input" value={editForm.capacite || 0} onChange={e => setEditForm({...editForm, capacite: parseInt(e.target.value)})} /> : <div className="o-field-value font-bold text-slate-800">{salle.capacite} invités</div>}
            </div>
            <div className="o-form-group">
              <label className="o-field-label flex items-center gap-2"><Banknote size={13}/> Tarif Journalier</label>
              {isEditing ? <input type="number" className="o-input" value={editForm.prix_par_jour || 0} onChange={e => setEditForm({...editForm, prix_par_jour: parseInt(e.target.value)})} /> : <div className="text-xl font-black text-purple-900">{salle.prix_par_jour?.toLocaleString('fr-DZ')} DA</div>}
            </div>
            <div className="o-form-group">
              <label className="o-field-label flex items-center gap-2"><Phone size={13}/> Contact</label>
              {isEditing ? <input className="o-input" value={editForm.telephone || ''} onChange={e => setEditForm({...editForm, telephone: e.target.value})} /> : <div className="o-field-value text-teal-600 font-bold">{salle.telephone ?? 'Non renseigné'}</div>}
            </div>
            <div className="o-form-group">
              <label className="o-field-label flex items-center gap-2"><Star size={13}/> Note Moyenne</label>
              <div className="text-amber-500 font-black text-lg flex items-center gap-1">★ {salle.note_moyenne || '0.0'}</div>
            </div>
          </div>

          <div className="o-divider" />
          <div className="o-form-section">Description &amp; Services</div>
          <div className="o-form-group full">
            {isEditing ? <textarea className="o-input h-32" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} /> : <div className="text-slate-600 leading-relaxed text-base whitespace-pre-wrap py-2">{salle.description || "Aucune description fournie."}</div>}
          </div>
        </div>

        {/* Chatter Section */}
        <div className="o-chatter bg-slate-50/50 p-6 rounded-b-xl border-t">
          <div className="flex items-center gap-2 font-bold text-slate-700 mb-6"><MessageSquare size={18}/> Avis ({comments.length})</div>
          
          {user ? (
            <div className="flex gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm uppercase">{user.user_metadata?.full_name?.substring(0, 2) || 'U'}</div>
              <div className="flex-1">
                <textarea className="o-input text-sm h-20 resize-none mb-2" placeholder="Laissez un commentaire..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                <button className="o-btn o-btn-primary float-right flex items-center gap-2" onClick={handleAddComment} disabled={!newComment.trim() || commenting}>{commenting ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} Publier</button>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 bg-white border border-dashed rounded-lg text-sm text-slate-500 mb-6">Veuillez <Link href="/auth" className="text-purple-700 font-bold underline">vous connecter</Link> pour laisser un avis.</div>
          )}

          <div className="space-y-4 clear-both pt-4">
            {comments.length === 0 && <p className="text-center text-slate-400 text-sm py-4 italic">Aucun avis pour le moment.</p>}
            {comments.map(c => (
              <div key={c.id} className="o-activity group">
                <div className="o-activity-avatar bg-slate-200 text-slate-600">{c.user?.full_name?.substring(0, 2).toUpperCase() || 'U'}</div>
                <div className="o-activity-body flex-1">
                  <div className="o-activity-head">
                    <span className="font-bold text-slate-800">{c.user?.full_name}</span>
                    <span className="text-[10px] text-slate-400 ml-2 uppercase">— {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: fr })}</span>
                  </div>
                  <div className="text-slate-600 text-sm mt-1">{c.content}</div>
                </div>
                {(user?.id === c.user_id || userRole === 'admin') && (
                  <button onClick={() => setDeleteCommentId(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog open={!!deleteCommentId} title="Supprimer ?" message="Confirmez-vous la suppression ?" confirmLabel="Supprimer" onConfirm={confirmDeleteComment} onCancel={() => setDeleteCommentId(null)} danger />
    </div>
  );
}