'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function WebsiteNav() {
  const [user, setUser] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(!!data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(!!s?.user));
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => { subscription.unsubscribe(); window.removeEventListener('scroll', fn); };
  }, []);

  return (
    <header className="o-website-nav" style={{ boxShadow: scrolled ? '0 2px 8px rgba(0,0,0,.08)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div className="o-brand-icon">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#212529', letterSpacing: '-.2px' }}>Saha Event</span>
        </Link>
        <div style={{ width: 1, height: 20, background: '#E0E0E0', margin: '0 8px' }} />
        <nav style={{ display: 'flex', gap: 2 }}>
          {[['Accueil', '/'], ['Salles des fêtes', '/halls'], ['Tarifs', '/#pricing']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 13, color: '#555', padding: '4px 10px', borderRadius: 4, textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#714B67')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
              {l}
            </Link>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <Link href="/dashboard" className="o-btn o-btn-primary">Mon espace →</Link>
        ) : (
          <>
            <Link href="/auth" className="o-btn o-btn-secondary">Se connecter</Link>
            <Link href="/auth?mode=register" className="o-btn o-btn-primary">Essai gratuit</Link>
          </>
        )}
      </div>
    </header>
  );
}
