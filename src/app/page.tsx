'use client';

import Link from 'next/link';
import Image from 'next/image';
import WebsiteNav from '@/components/WebsiteNav';
import { useEffect, useRef } from 'react';

const HALLS = [
  { name: 'Palais des Lumières', city: 'Alger', price: 120000, rating: 4.8, guests: 500, img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80' },
  { name: 'Villa Jasmine',        city: 'Zeralda', price: 85000, rating: 4.9, guests: 250, img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80' },
  { name: 'Salle Al Andalous',   city: 'Oran',    price: 95000, rating: 4.7, guests: 400, img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80' },
];

const FEATURES = [
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', color: '#714B67', bg: '#F3EFF2', title: 'Réservation en ligne', desc: 'Réservez une salle en quelques clics. Upload de reçu CCP pour validation.' },
  { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',       color: '#28A745', bg: '#EBF6EC', title: 'Données sécurisées',   desc: 'Row-Level Security — isolation totale des données par utilisateur.' },
  { icon: 'M18 20V10M12 20V4M6 20v-6',                           color: '#0078BF', bg: '#E3F2FD', title: 'Analytique avancée',  desc: 'Tableaux de bord avec KPIs et rapports en temps réel.' },
  { icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',          color: '#E9A800', bg: '#FFF9E6', title: 'Multi-rôles',         desc: 'Clients, propriétaires et admins avec accès adaptés.' },
];

export default function HomePage() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Scroll reveal animation
    observerRef.current = new IntersectionObserver(
      entries => entries.forEach(e => { 
        if (e.isIntersecting) { 
          (e.target as HTMLElement).style.opacity = '1'; 
          (e.target as HTMLElement).style.transform = 'translateY(0)'; 
        } 
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(24px)';
      (el as HTMLElement).style.transition = 'opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1)';
      observerRef.current?.observe(el);
    });

    // Animate stats counter
    const animateStats = () => {
      if (!statsRef.current) return;
      const stats = statsRef.current.querySelectorAll('[data-target]');
      stats.forEach((stat: Element) => {
        const htmlStat = stat as HTMLElement;
        const target = parseFloat(htmlStat.dataset.target || '0');
        const duration = 1500;
        const start = Date.now();
        const initial = parseFloat(htmlStat.textContent || '0');

        const animate = () => {
          const now = Date.now();
          const progress = Math.min((now - start) / duration, 1);
          const value = initial + (target - initial) * progress;
          htmlStat.textContent = Math.floor(value).toLocaleString('fr-DZ');
          if (progress < 1) requestAnimationFrame(animate);
        };
        animate();
      });
    };

    const statsObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        animateStats();
        statsObserver.unobserve(entries[0].target);
      }
    }, { threshold: 0.5 });

    if (statsRef.current) statsObserver.observe(statsRef.current);

    return () => { 
      observerRef.current?.disconnect(); 
      statsObserver.disconnect();
    };
  }, []);

  return (
    <div style={{ background: '#fff' }}>
      <WebsiteNav />

      {/* ── HERO ─────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #3D1D52 0%, #714B67 55%, #875A7B 100%)',
        padding: '72px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,.1), transparent)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-100px',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,.1), transparent)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,.12)',
            border: '1px solid rgba(255,255,255,.2)',
            borderRadius: 20,
            padding: '6px 16px',
            marginBottom: 20,
            animation: 'o-slide-in-up 0.6s cubic-bezier(0.4,0,0.2,1)'
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#4CAF50',
              display: 'inline-block',
              animation: 'o-pulse 2s ease-in-out infinite'
            }}></span>
            <span style={{
              fontSize: 11,
              color: 'rgba(255,255,255,.85)',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              fontWeight: 600
            }}>Plateforme N°1 en Algérie</span>
          </div>

          <h1 style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-.6px',
            lineHeight: 1.2,
            marginBottom: 16,
            animation: 'o-slide-in-up 0.6s cubic-bezier(0.4,0,0.2,1) 0.1s backwards'
          }}>
            La gestion d&apos;événements<br />réinventée pour l&apos;Algérie
          </h1>

          <p style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,.8)',
            maxWidth: '540px',
            margin: '0 auto 32px',
            lineHeight: 1.7,
            animation: 'o-slide-in-up 0.6s cubic-bezier(0.4,0,0.2,1) 0.2s backwards'
          }}>
            Réservez, gérez et analysez vos salles des fêtes depuis une plateforme cloud unique. Rapide, sécurisée, et conçue pour les professionnels.
          </p>

          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            animation: 'o-slide-in-up 0.6s cubic-bezier(0.4,0,0.2,1) 0.3s backwards'
          }}>
            <Link href="/auth?mode=register" className="o-btn o-btn-primary o-btn-lg" style={{ fontSize: 14, padding: '12px 28px' }}>
              Commencer gratuitement →
            </Link>
            <Link href="/halls" className="o-btn o-btn-secondary o-btn-lg" style={{ fontSize: 14, padding: '12px 28px', background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.2)' }}>
              Voir les salles
            </Link>
          </div>

          <div ref={statsRef} style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 48,
            marginTop: 48,
            paddingTop: 32,
            borderTop: '1px solid rgba(255,255,255,.15)',
            animation: 'o-fade-in 0.8s cubic-bezier(0.4,0,0.2,1) 0.5s backwards'
          }}>
            {[{ target: 200, label: 'Salles' }, { target: 48, label: 'Wilayas' }, { target: 12000, label: 'Réservations' }].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: '#fff',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums'
                }} data-target={stat.target}>0</div>
                <div style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,.6)',
                  marginTop: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em'
                }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────── */}
      <section style={{ padding: '64px 32px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }} className="reveal">
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#714B67',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 12
            }}>Fonctionnalités</div>
            <h2 style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#212529',
              letterSpacing: '-.5px',
              marginBottom: 12
            }}>Tout ce dont vous avez besoin</h2>
            <p style={{
              fontSize: 15,
              color: '#888',
              maxWidth: 540,
              margin: '0 auto',
              lineHeight: 1.7
            }}>Une solution complète pour la gestion de vos événements, de la réservation au paiement.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20
          }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="reveal" style={{
                transitionDelay: `${i * 100}ms`,
                border: '1px solid #E8E8E8',
                borderRadius: 10,
                padding: 24,
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                cursor: 'pointer'
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = '0 12px 32px rgba(113,75,103,.15)';
                  el.style.transform = 'translateY(-6px)';
                  el.style.borderColor = '#D4C3D0';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)';
                  el.style.transform = 'translateY(0)';
                  el.style.borderColor = '#E8E8E8';
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: f.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={f.color} strokeWidth="1.8"><path d={f.icon} /></svg>
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#212529',
                  marginBottom: 8
                }}>{f.title}</div>
                <div style={{
                  fontSize: 13,
                  color: '#888',
                  lineHeight: 1.6
                }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HALLS PREVIEW ────────────────────── */}
      <section style={{ padding: '64px 32px', background: '#F8F9FC' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 32
          }} className="reveal">
            <div>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#714B67',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                marginBottom: 8
              }}>Catalogue</div>
              <h2 style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#212529',
                letterSpacing: '-.3px'
              }}>Salles des fêtes en vedette</h2>
            </div>
            <Link href="/halls" className="o-btn o-btn-link">Voir tout →</Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20
          }}>
            {HALLS.map((h, i) => (
              <div key={h.name} className="reveal" style={{
                transitionDelay: `${i * 100}ms`,
                background: '#fff',
                border: '1px solid #E0E0E0',
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,.06)'
              }}
                onClick={() => window.location.href = '/halls'}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = '0 12px 32px rgba(113,75,103,.15)';
                  el.style.transform = 'translateY(-6px)';
                  el.style.borderColor = '#D4C3D0';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)';
                  el.style.transform = 'translateY(0)';
                  el.style.borderColor = '#E0E0E0';
                }}
              >
                <div style={{ position: 'relative', height: 180 }}>
                  <Image src={h.img} alt={h.name} fill style={{ objectFit: 'cover' }} sizes="300px" />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,.25), transparent)'
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'rgba(255,255,255,.95)',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#212529',
                    boxShadow: '0 4px 12px rgba(0,0,0,.15)'
                  }}>
                    ★ {h.rating}
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#212529',
                    marginBottom: 4
                  }}>{h.name}</div>
                  <div style={{
                    fontSize: 12,
                    color: '#888',
                    marginBottom: 12
                  }}>📍 {h.city} · {h.guests} invités max</div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#714B67'
                    }}>
                      {h.price.toLocaleString('fr-DZ')} DA<span style={{
                        fontSize: 12,
                        fontWeight: 400,
                        color: '#888'
                      }}>/j</span>
                    </div>
                    <button className="o-btn o-btn-primary o-btn-sm">
                      Réserver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────── */}
      <section id="pricing" style={{ padding: '64px 32px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }} className="reveal">
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#714B67',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 12
            }}>Tarifs</div>
            <h2 style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#212529',
              letterSpacing: '-.5px',
              marginBottom: 12
            }}>Des plans adaptés à vos besoins</h2>
            <p style={{
              fontSize: 15,
              color: '#888',
              maxWidth: 540,
              margin: '0 auto',
              lineHeight: 1.7
            }}>Commencez gratuitement et mettez à niveau lorsque vous êtes prêt.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24
          }}>
            {/* Basic Plan */}
            <div className="reveal" style={{ transitionDelay: '0ms', border: '1px solid #E8E8E8', borderRadius: 10, padding: 32, background: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#212529', marginBottom: 8 }}>Standard</h3>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#714B67', marginBottom: 16 }}>Gratuit<span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>/toujours</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', flex: 1 }}>
                {['1 Salle des fêtes', 'Jusqu\'à 50 réservations/mois', 'Support par email', 'Statistiques de base'].map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 14, color: '#555' }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#28A745" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link href="/auth?mode=register" className="o-btn o-btn-secondary" style={{ width: '100%', padding: '10px' }}>Commencer</Link>
            </div>

            {/* Pro Plan */}
            <div className="reveal" style={{ transitionDelay: '100ms', border: '2px solid #714B67', borderRadius: 10, padding: 32, background: '#fff', position: 'relative', boxShadow: '0 8px 24px rgba(113,75,103,.12)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#714B67', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>Le plus populaire</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#212529', marginBottom: 8 }}>Professionnel</h3>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#714B67', marginBottom: 16 }}>4 900 DA<span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>/mois</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', flex: 1 }}>
                {['Salles illimitées', 'Réservations illimitées', 'Support prioritaire 24/7', 'Analytique avancée', 'Export PDF/Excel'].map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 14, color: '#555' }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#714B67" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link href="/auth?mode=register" className="o-btn o-btn-primary" style={{ width: '100%', padding: '10px' }}>Commencer l&apos;essai gratuit</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #714B67 0%, #5E3D56 100%)',
        padding: '64px 32px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }} className="reveal">
          <h2 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-.4px',
            marginBottom: 14
          }}>Prêt à gérer vos événements ?</h2>
          <p style={{
            fontSize: 15,
            color: 'rgba(255,255,255,.8)',
            marginBottom: 32,
            lineHeight: 1.7
          }}>Rejoignez plus de 12 000 propriétaires qui font confiance à Saha Event pour leurs célébrations.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/auth?mode=register" className="o-btn o-btn-primary" style={{ background: '#fff', color: '#714B67' }}>
              Créer un compte gratuit
            </Link>
            <Link href="/halls" className="o-btn o-btn-secondary" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.2)' }}>
              Parcourir les salles
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#fff',
        borderTop: '1px solid #E8E8E8',
        padding: '24px 32px'
      }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="o-brand-icon" style={{ width: 24, height: 24 }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#212529' }}>Saha Event</span>
          </div>
          <span style={{ fontSize: 12, color: '#AAAAAA' }}>© 2026 Saha Event · Architecture Cloud &amp; Vibe Programming · 2CP</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/halls" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>Salles</Link>
            <Link href="/auth" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
