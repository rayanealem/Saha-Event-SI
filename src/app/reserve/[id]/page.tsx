'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import WebsiteNav from '@/components/WebsiteNav';
import ImageWithFallback from '@/components/ImageWithFallback';
import { createClient } from '@/lib/supabase';
import type { Salle, EventType } from '@/lib/types';
import { ArrowLeft, Upload, CalendarDays, Users, FileText, Loader2, CheckCircle2, AlertCircle, X, PartyPopper } from 'lucide-react';
import { differenceInDays, format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: 'mariage', label: 'Mariage', icon: '💍' },
  { value: 'anniversaire', label: 'Anniversaire', icon: '🎂' },
  { value: 'fiancailles', label: 'Fiançailles', icon: '💐' },
  { value: 'conference', label: 'Conférence', icon: '🎤' },
  { value: 'gala', label: 'Gala / Soirée', icon: '✨' },
  { value: 'autre', label: 'Autre', icon: '🎉' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 13,
  border: '1.5px solid #E0E0E0', borderRadius: 6, outline: 'none',
  background: '#FAFAFA', transition: 'all 0.2s ease', fontFamily: 'inherit',
  color: '#212529',
};

const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#714B67';
  e.target.style.boxShadow = '0 0 0 3px rgba(113,75,103,.1)';
  e.target.style.background = '#fff';
};
const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = '#E0E0E0';
  e.target.style.boxShadow = 'none';
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E8E8E8',
  borderRadius: 8,
  boxShadow: '0 1px 3px rgba(0,0,0,.08)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#212529',
  paddingBottom: 8, borderBottom: '1px solid #F0F0F0', marginBottom: 14,
  display: 'flex', alignItems: 'center', gap: 8,
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#555',
  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5,
};

export default function ReservePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [salle, setSalle] = useState<Salle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dateConflict, setDateConflict] = useState('');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const [form, setForm] = useState({ date_debut: tomorrow, date_fin: format(addDays(new Date(), 2), 'yyyy-MM-dd'), nombre_invites: 100, type_evenement: 'mariage' as EventType, notes: '' });
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [serverMontant, setServerMontant] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('salles').select('*').eq('id', id).single().then(({ data }) => { setSalle(data); setLoading(false); });
  }, [id]);

  const nbJours = Math.max(1, differenceInDays(new Date(form.date_fin), new Date(form.date_debut)) + 1);
  const total = salle ? salle.prix_par_jour * nbJours : 0;

  // Issue #2: Check date availability whenever dates change
  const checkAvailability = useCallback(async () => {
    if (!form.date_debut || !form.date_fin) return;
    setDateConflict('');
    const { data, error: rpcErr } = await supabase.rpc('check_date_availability', {
      p_salle_id: id,
      p_date_debut: form.date_debut,
      p_date_fin: form.date_fin,
    });
    if (rpcErr) { console.error('Availability check error:', rpcErr); return; }
    if (data === false) {
      // Fetch the conflicting reservation dates for a clear message
      const { data: conflicts } = await supabase.from('reservations')
        .select('date_debut, date_fin')
        .eq('salle_id', id)
        .in('statut', ['en_attente', 'confirmee'])
        .lte('date_debut', form.date_fin)
        .gte('date_fin', form.date_debut)
        .limit(1);
      if (conflicts && conflicts.length > 0) {
        const c = conflicts[0];
        setDateConflict(`Cette salle est déjà réservée du ${format(new Date(c.date_debut), 'dd MMM yyyy', { locale: fr })} au ${format(new Date(c.date_fin), 'dd MMM yyyy', { locale: fr })}`);
      } else {
        setDateConflict('Cette salle n\'est pas disponible pour les dates sélectionnées.');
      }
    }
  }, [form.date_debut, form.date_fin, id, supabase]);

  useEffect(() => {
    if (salle) checkAvailability();
  }, [form.date_debut, form.date_fin, salle, checkAvailability]);

  // Issue #4: Get server-calculated montant
  useEffect(() => {
    if (!salle || !form.date_debut || !form.date_fin) return;
    supabase.rpc('calculate_montant', {
      p_salle_id: id,
      p_date_debut: form.date_debut,
      p_date_fin: form.date_fin,
    }).then(({ data }) => {
      if (data !== null) setServerMontant(Number(data));
    });
  }, [form.date_debut, form.date_fin, salle, id]);

  const displayTotal = serverMontant ?? total;

  // Issue #16: Sync date_fin min with date_debut
  const handleDateDebutChange = (value: string) => {
    setForm(p => {
      const newForm = { ...p, date_debut: value };
      // If date_fin is before or equal to new date_debut, push it forward
      if (new Date(p.date_fin) <= new Date(value)) {
        newForm.date_fin = format(addDays(new Date(value), 1), 'yyyy-MM-dd');
      }
      return newForm;
    });
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { setError('Fichier PDF uniquement.'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('Fichier trop volumineux (max 5 MB).'); return; }
    setFile(f); setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!file) { setError('Le reçu de paiement CCP (PDF) est obligatoire.'); return; }
    if (new Date(form.date_fin) < new Date(form.date_debut)) { setError('La date de fin doit être après la date de début.'); return; }
    if (form.nombre_invites > (salle?.capacite ?? 9999)) { setError(`Capacité max : ${salle?.capacite} invités.`); return; }
    if (dateConflict) { setError(dateConflict); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth?session=expired'); return; }

      // Issue #2: Server-side availability check before insert
      const { data: available } = await supabase.rpc('check_date_availability', {
        p_salle_id: id, p_date_debut: form.date_debut, p_date_fin: form.date_fin,
      });
      if (available === false) { setError('Cette salle n\'est plus disponible pour ces dates. Veuillez choisir d\'autres dates.'); setSubmitting(false); return; }

      const path = `${user.id}/${Date.now()}-recu.pdf`;
      const { error: upErr } = await supabase.storage.from('receipts').upload(path, file, { contentType: 'application/pdf' });
      if (upErr) throw upErr;

      // Issue #3: Don't use getPublicUrl for private bucket - store path only
      // Issue #4: montant_total will be enforced server-side by trigger
      const { error: insErr } = await supabase.from('reservations').insert({
        client_id: user.id, salle_id: id,
        date_debut: form.date_debut, date_fin: form.date_fin,
        nombre_invites: form.nombre_invites, type_evenement: form.type_evenement,
        notes: form.notes || null, montant_total: displayTotal, statut: 'en_attente',
        recu_paiement_url: null, recu_paiement_path: path,
      });
      if (insErr) throw insErr;
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réservation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="o-loading-skeleton" style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px' }} />
        <div className="o-loading-skeleton" style={{ width: 120, height: 14, borderRadius: 4 }} />
      </div>
    </div>
  );

  if (!salle) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888', fontSize: 13 }}>Salle introuvable</p>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8F9FC 0%, #F1F1F1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ ...cardStyle, maxWidth: 420, width: '100%', padding: 40, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: '#EBF6EC', border: '1px solid #A5D6A7',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <PartyPopper style={{ width: 32, height: 32, color: '#28A745' }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#212529', marginBottom: 8 }}>Réservation envoyée !</h1>
        <p style={{ color: '#555', fontSize: 13, marginBottom: 4 }}>Votre demande pour <strong>{salle.nom}</strong> a été enregistrée.</p>
        <p style={{ color: '#888', fontSize: 11, marginBottom: 28 }}>Notre équipe vérifiera votre reçu CCP et confirmera sous 24h.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/dashboard" className="o-btn o-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Mon tableau de bord</Link>
          <Link href="/halls" className="o-btn o-btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Autres salles</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="o-website">
      <WebsiteNav />
      <div style={{ paddingTop: 20 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
          <Link href={`/halls/${id}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 12,
            textDecoration: 'none', marginBottom: 24, transition: 'color .15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#714B67')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888')}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} /> Retour à la salle
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#212529' }}>
                Réserver <span style={{ color: '#714B67' }}>{salle.nom}</span>
              </h1>
              <p style={{ color: '#888', fontSize: 12, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CalendarDays style={{ width: 12, height: 12 }} /> {salle.ville}, {salle.wilaya}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28, alignItems: 'start' }}>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Event type */}
              <div style={{ ...cardStyle, padding: 20 }}>
                <h2 style={sectionTitleStyle}>Type d&apos;événement</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                  {EVENT_TYPES.map(et => (
                    <button key={et.value} type="button" onClick={() => setForm(p => ({ ...p, type_evenement: et.value }))}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        padding: 12, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                        transition: 'all .2s',
                        border: form.type_evenement === et.value ? '2px solid #714B67' : '2px solid #E8E8E8',
                        background: form.type_evenement === et.value ? '#F3EFF2' : '#fff',
                        color: form.type_evenement === et.value ? '#714B67' : '#888',
                      }}>
                      <span style={{ fontSize: 20 }}>{et.icon}</span>
                      <span style={{ fontSize: 10 }}>{et.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates - Issue #16: dynamic min/max sync + visual indicators */}
              <div style={{ ...cardStyle, padding: 20 }}>
                <h2 style={sectionTitleStyle}>
                  <CalendarDays style={{ width: 16, height: 16, color: '#714B67' }} />Dates
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Date de début *</label>
                    <input type="date" value={form.date_debut} min={tomorrow} onChange={e => handleDateDebutChange(e.target.value)} required style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                  </div>
                  <div>
                    <label style={labelStyle}>Date de fin *</label>
                    <input type="date" value={form.date_fin} min={form.date_debut || tomorrow} onChange={e => setForm(p => ({ ...p, date_fin: e.target.value }))} required style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                  </div>
                </div>
                {/* Issue #16: Real-time days + amount indicator */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, padding: '8px 12px', background: '#F8F9FC', borderRadius: 6, border: '1px solid #E8E8E8' }}>
                  <span style={{ color: '#714B67', fontSize: 12, fontWeight: 600 }}>
                    📅 {nbJours} jour{nbJours > 1 ? 's' : ''}
                  </span>
                  <span style={{ color: '#714B67', fontSize: 14, fontWeight: 700 }}>
                    {displayTotal.toLocaleString('fr-DZ')} DA
                  </span>
                </div>

                {/* Issue #9: Date conflict warning */}
                {dateConflict && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FFF9E6', border: '1px solid #F0DA8A', borderRadius: 6, padding: 12, animation: 'o-slide-in-up 0.3s ease' }}>
                    <AlertCircle style={{ width: 16, height: 16, color: '#E9A800', marginTop: 1, flexShrink: 0 }} />
                    <p style={{ color: '#7A5C00', fontSize: 12, margin: 0 }}>{dateConflict}</p>
                  </div>
                )}
              </div>

              {/* Guests */}
              <div style={{ ...cardStyle, padding: 20 }}>
                <h2 style={sectionTitleStyle}>
                  <Users style={{ width: 16, height: 16, color: '#714B67' }} />Nombre d&apos;invités
                </h2>
                <input type="number" value={form.nombre_invites} min={10} max={salle.capacite} onChange={e => setForm(p => ({ ...p, nombre_invites: +e.target.value }))} required style={{ ...inputStyle, width: 200 }} onFocus={focusInput} onBlur={blurInput} />
                <p style={{ color: '#888', fontSize: 11, marginTop: 4 }}>Capacité maximale : {salle.capacite} invités</p>
              </div>

              {/* Notes */}
              <div style={{ ...cardStyle, padding: 20 }}>
                <label style={sectionTitleStyle}>Notes &amp; demandes spéciales</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Décoration, menu, disposition particulière..."
                  style={{ ...inputStyle, resize: 'none' } as React.CSSProperties}
                  onFocus={focusInput as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
                  onBlur={blurInput as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
                />
              </div>

              {/* File upload */}
              <div style={{ ...cardStyle, padding: 20 }}>
                <h2 style={sectionTitleStyle}>
                  <FileText style={{ width: 16, height: 16, color: '#714B67' }} />
                  Reçu de paiement CCP <span style={{ color: '#888', fontWeight: 400, fontSize: 12 }}>(PDF obligatoire)</span>
                </h2>
                {!file ? (
                  <div className={drag ? 'o-upload drag' : 'o-upload'}
                    onDragOver={e => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}>
                    <Upload style={{ width: 24, height: 24, color: '#888', margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Glissez votre reçu CCP ici</p>
                    <p style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>ou</p>
                    <label className="o-btn o-btn-secondary o-btn-sm" style={{ cursor: 'pointer' }}>
                      Parcourir
                      <input type="file" accept=".pdf,application/pdf" onChange={e => handleFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                    </label>
                    <p style={{ color: '#888', fontSize: 11, marginTop: 12 }}>PDF uniquement · Max 5 MB</p>
                  </div>
                ) : (
                  <div className="o-upload-success">
                    <FileText style={{ width: 32, height: 32, color: '#28A745', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#1B5E20', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                      <p style={{ color: '#28A745', fontSize: 11 }}>{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4, transition: 'color .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#DC3545')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
                      <X style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FDECEA', border: '1px solid #FFCDD2', borderRadius: 6, padding: 14, animation: 'o-slide-in-up 0.3s ease' }}>
                  <AlertCircle style={{ width: 16, height: 16, color: '#DC3545', marginTop: 2, flexShrink: 0 }} />
                  <p style={{ color: '#C62828', fontSize: 13 }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={submitting || !!dateConflict} className="o-btn o-btn-primary o-btn-lg" style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: 14 }}>
                {submitting ? <><Loader2 className="o-spin" style={{ width: 16, height: 16 }} /> Envoi en cours...</> : <><CheckCircle2 style={{ width: 16, height: 16 }} /> Confirmer la réservation</>}
              </button>
            </form>

            {/* Summary sidebar */}
            <div>
              <div style={{ ...cardStyle, padding: 20, position: 'sticky', top: 80 }}>
                <h3 style={sectionTitleStyle}>Récapitulatif</h3>
                {salle.image_url && (
                  <div style={{ position: 'relative', height: 112, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                    <ImageWithFallback src={salle.image_url} alt={salle.nom} fallbackText={salle.nom} fill style={{ objectFit: 'cover' }} sizes="250px" />
                  </div>
                )}
                <p style={{ fontWeight: 600, color: '#212529', fontSize: 13, marginBottom: 2 }}>{salle.nom}</p>
                <p style={{ color: '#888', fontSize: 11, marginBottom: 16 }}>{salle.ville}, {salle.wilaya}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  {[
                    ['Type', EVENT_TYPES.find(e => e.value === form.type_evenement)?.label ?? ''],
                    ['Du', format(new Date(form.date_debut), 'dd MMM yyyy', { locale: fr })],
                    ['Au', format(new Date(form.date_fin), 'dd MMM yyyy', { locale: fr })],
                    ['Durée', `${nbJours} jour${nbJours > 1 ? 's' : ''}`],
                    ['Invités', `${form.nombre_invites} personnes`],
                    ['Prix/jour', `${salle.prix_par_jour.toLocaleString('fr-DZ')} DA`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>{k}</span>
                      <span style={{ color: '#555', fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #F0F0F0', marginTop: 8 }}>
                    <span style={{ fontWeight: 600, color: '#212529' }}>Total</span>
                    <span style={{ fontWeight: 700, color: '#714B67', fontSize: 14 }}>{displayTotal.toLocaleString('fr-DZ')} DA</span>
                  </div>
                </div>
                <p style={{ color: '#888', fontSize: 10, marginTop: 16, lineHeight: 1.6 }}>
                  * Montant calculé côté serveur. Confirmation après vérification de votre reçu CCP.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
