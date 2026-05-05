'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
  'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou',
  'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba',
  'Guelma', 'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla',
  'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf',
  'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila',
  'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane',
];

type Tab = 'login' | 'register';
type AccountType = 'client' | 'owner';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 13,
  border: '1.5px solid #E0E0E0', borderRadius: 6, outline: 'none',
  background: '#FAFAFA', transition: 'all 0.2s ease', fontFamily: 'inherit',
  color: '#212529',
};

const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#714B67';
  e.target.style.boxShadow = '0 0 0 3px rgba(113,75,103,.1)';
  e.target.style.background = '#fff';
};
const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = '#E0E0E0';
  e.target.style.boxShadow = 'none';
};

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>(params.get('mode') === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Issue #5: Show session expired message if redirected
  const isSessionExpired = params.get('session') === 'expired';

  const redirectTo = params.get('redirectTo') ?? '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error: err, data: signInData } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setLoading(false); setError(err.message); return; }

    // Check role to redirect appropriately
    if (signInData.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', signInData.user.id).single();
      setLoading(false);
      if (profile?.role === 'admin') {
        router.push(redirectTo === '/dashboard' ? '/admin' : redirectTo);
      } else if (profile?.role === 'owner') {
        router.push(redirectTo === '/dashboard' ? '/owner/dashboard' : redirectTo);
      } else {
        router.push(redirectTo);
      }
      router.refresh();
    } else {
      setLoading(false);
      router.push(redirectTo);
      router.refresh();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role: accountType } },
    });
    if (err) { setLoading(false); setError(err.message); return; }
    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id, full_name: name, wilaya, role: accountType,
      });
    }
    setLoading(false);
    setSuccess('Compte créé ! Connectez-vous maintenant.');
    setTab('login');
  };

  const switchTab = (t: Tab) => { setTab(t); setError(''); setSuccess(''); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #F8F9FC 0%, #F1F1F1 100%)' }}>

      {/* ── LEFT BRAND PANEL ─────────────────── */}
      <div style={{
        width: '42%', minWidth: 300,
        background: 'linear-gradient(135deg, #3D1D52 0%, #714B67 55%, #875A7B 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '48px 40px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240, background: 'radial-gradient(circle, rgba(255,255,255,.12), transparent)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 240, height: 240, background: 'radial-gradient(circle, rgba(255,255,255,.12), transparent)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 300 }}>
          <div style={{ width: 80, height: 80, background: 'linear-gradient(145deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,.08) 100%)', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(255,255,255,.25)', animation: 'o-bounce 3s ease-in-out infinite', boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 1px rgba(255,255,255,.3), 0 2px 4px rgba(0,0,0,.15)', backdropFilter: 'blur(8px)' }}>
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.3))' }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-.3px', marginBottom: 6 }}>Saha Event</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginBottom: 36, lineHeight: 1.6 }}>La plateforme événementielle de référence en Algérie</div>

          {[
            { icon: '🔐', text: 'Authentification sécurisée', gradient: 'linear-gradient(135deg, #E8B33A 0%, #D4972E 100%)' },
            { icon: '📅', text: 'Réservation en quelques clics', gradient: 'linear-gradient(135deg, #5B9BD5 0%, #4178B0 100%)' },
            { icon: '📊', text: 'Tableau de bord analytique', gradient: 'linear-gradient(135deg, #7B68EE 0%, #6349D6 100%)' },
            { icon: '📄', text: 'Upload reçu CCP intégré', gradient: 'linear-gradient(135deg, #50C878 0%, #3DAF63 100%)' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 10, padding: '10px 16px',
              background: 'rgba(255,255,255,.1)', borderRadius: 12,
              border: '1px solid rgba(255,255,255,.15)',
              animation: `o-slide-in-right 0.5s cubic-bezier(0.4,0,0.2,1) ${i * 80 + 200}ms backwards`,
              backdropFilter: 'blur(4px)',
              boxShadow: '0 4px 16px rgba(0,0,0,.12), inset 0 1px 1px rgba(255,255,255,.1)',
              transition: 'all 0.3s ease',
            }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.18)';
                (e.currentTarget as HTMLElement).style.transform = 'translateX(6px) scale(1.02)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.2), inset 0 1px 1px rgba(255,255,255,.15)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.1)';
                (e.currentTarget as HTMLElement).style.transform = 'translateX(0) scale(1)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,.12), inset 0 1px 1px rgba(255,255,255,.1)';
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: f.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,.25), inset 0 1px 1px rgba(255,255,255,.4)',
                border: '1px solid rgba(255,255,255,.15)',
              }}>{f.icon}</div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.9)', fontWeight: 600 }}>{f.text}</span>
            </div>
          ))}

          <div style={{ marginTop: 28, padding: '12px 16px', background: 'rgba(255,255,255,.1)', borderRadius: 8, border: '1px solid rgba(255,255,255,.15)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Comptes de test</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', lineHeight: 1.8, fontFamily: 'monospace' }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 9, background: 'rgba(220,53,69,.4)', padding: '1px 6px', borderRadius: 3, marginRight: 6 }}>ADMIN</span>
                admin@saha-event.dz / Admin1234!
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 9, background: 'rgba(13,71,161,.4)', padding: '1px 6px', borderRadius: 3, marginRight: 6 }}>OWNER</span>
                owner@saha-event.dz / Owner1234!
              </div>
              <div>
                <span style={{ fontSize: 9, background: 'rgba(40,167,69,.4)', padding: '1px 6px', borderRadius: 3, marginRight: 6 }}>CLIENT</span>
                test@saha-event.dz / Test1234!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ─────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Back link */}
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#888', textDecoration: 'none', marginBottom: 28, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#714B67')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            Retour à l&apos;accueil
          </Link>

          {/* Tab switcher */}
          <div style={{ display: 'flex', background: '#EFEFEF', borderRadius: 8, padding: 3, marginBottom: 28 }}>
            {(['login', 'register'] as Tab[]).map(t => (
              <button key={t} onClick={() => switchTab(t)} style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: 6,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? '#212529' : '#888',
                boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,.1)' : 'none',
              }}>
                {t === 'login' ? 'Se connecter' : 'Créer un compte'}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#212529', marginBottom: 4 }}>
              {tab === 'login' ? 'Bon retour 👋' : 'Créer un compte'}
            </h1>
            <p style={{ fontSize: 13, color: '#888' }}>
              {tab === 'login' ? 'Connectez-vous à votre espace Saha Event' : 'Rejoignez 12 000+ propriétaires'}
            </p>
          </div>

          {/* Alerts */}
          {isSessionExpired && !error && !success && (
            <div style={{ background: '#FFF9E6', border: '1px solid #F0DA8A', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#7A5C00', animation: 'o-slide-in-up 0.3s ease', display: 'flex', alignItems: 'center', gap: 8 }}>
              🔒 Votre session a expiré. Veuillez vous reconnecter.
            </div>
          )}
          {error && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#C62828', animation: 'o-slide-in-up 0.3s ease' }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#EBF6EC', border: '1px solid #A5D6A7', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#1B5E20', animation: 'o-slide-in-up 0.3s ease' }}>
              ✅ {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={tab === 'login' ? handleLogin : handleRegister}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {tab === 'register' && (
                <>
                  {/* Account Type Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Type de compte *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {([
                        { value: 'client' as AccountType, label: 'Client', icon: '👤', desc: 'Réserver des salles' },
                        { value: 'owner' as AccountType, label: 'Propriétaire', icon: '🏢', desc: 'Gérer mes salles' },
                      ]).map(at => (
                        <button
                          key={at.value}
                          type="button"
                          onClick={() => setAccountType(at.value)}
                          style={{
                            padding: '12px 14px',
                            border: accountType === at.value ? '2px solid #714B67' : '2px solid #E0E0E0',
                            borderRadius: 8,
                            background: accountType === at.value ? '#F3EFF2' : '#fff',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ fontSize: 20, marginBottom: 4 }}>{at.icon}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: accountType === at.value ? '#714B67' : '#333' }}>{at.label}</div>
                          <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{at.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Nom complet *</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ahmed Benali" style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Adresse email *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ahmed@exemple.dz" style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Mot de passe *</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder={tab === 'register' ? 'Min. 8 caractères' : '••••••••'} style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
              </div>

              {tab === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Wilaya</label>
                  <select value={wilaya} onChange={e => setWilaya(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' } as React.CSSProperties} onFocus={focusInput} onBlur={blurInput}>
                    <option value="">Sélectionner une wilaya</option>
                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px',
                background: loading ? '#9B7695' : 'linear-gradient(135deg, #714B67 0%, #5E3D56 100%)',
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(113,75,103,.25)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                marginTop: 4,
              }}
                onMouseEnter={e => {
                  if (!loading) {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(113,75,103,.4)';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(113,75,103,.25)';
                }}
              >
                {loading && <Loader2 className="o-spin" style={{ width: 16, height: 16 }} />}
                {loading ? 'Chargement...' : tab === 'login' ? 'Se connecter →' : 'Créer mon compte →'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#888' }}>
            {tab === 'login' ? (
              <>Pas encore de compte ? <button onClick={() => switchTab('register')} style={{ color: '#714B67', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Créer un compte →</button></>
            ) : (
              <>Déjà un compte ? <button onClick={() => switchTab('login')} style={{ color: '#714B67', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Se connecter →</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="o-spin" style={{ width: 24, height: 24, color: '#714B67' }} />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
