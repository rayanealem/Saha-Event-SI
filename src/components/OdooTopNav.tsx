'use client';

import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Notification } from '@/lib/types';

const ADMIN_APPS = [
  { href: '/dashboard',              label: 'Tableau de bord' },
  { href: '/halls',                  label: 'Salles des fêtes' },
  { href: '/admin/salles',           label: 'Gestion des salles' },
  { href: '/admin/users',            label: 'Utilisateurs' },
  { href: '/admin',                  label: 'Administration' },
];

const OWNER_APPS = [
  { href: '/dashboard',              label: 'Tableau de bord' },
  { href: '/halls',                  label: 'Salles des fêtes' },
  { href: '/owner/salles',           label: 'Mes salles' },
  { href: '/owner/reservations',     label: 'Réservations reçues' },
  { href: '/owner/dashboard',        label: 'Mon activité' },
];

const CLIENT_APPS = [
  { href: '/dashboard',              label: 'Tableau de bord' },
  { href: '/halls',                  label: 'Salles des fêtes' },
  { href: '/dashboard/reservations', label: 'Réservations' },
];

export default function OdooTopNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const [initials, setInitials] = useState('ME');
  const [role, setRole] = useState('client');
  const [name, setName] = useState('');
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from('profiles').select('full_name, role').eq('id', data.user.id).single();
      if (p) {
        if (p.role) setRole(p.role);
        if (p.full_name) {
          setName(p.full_name as string);
          const parts = (p.full_name as string).trim().split(' ');
          setInitials((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? ''));
        }
      }
      loadNotifications();
    });

    const isDark = document.body.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.body.classList.add('dark');
      setDarkMode(true);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Subscribe to real-time notification updates
    const channel = supabase.channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        loadNotifications();
      })
      .subscribe();

    // Issue #5: Detect session expiry
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth?session=expired');
      }
    });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      supabase.removeChannel(channel);
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const toggleDarkMode = () => {
    if (darkMode) {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const APPS = role === 'admin' ? ADMIN_APPS : role === 'owner' ? OWNER_APPS : CLIENT_APPS;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success': return { color: '#28A745', bg: '#EBF6EC', icon: '✓' };
      case 'warning': return { color: '#E9A800', bg: '#FFF9E6', icon: '!' };
      case 'error':   return { color: '#DC3545', bg: '#FDECEA', icon: '✕' };
      default:        return { color: '#0078BF', bg: '#E3F2FD', icon: 'i' };
    }
  };

  return (
    <nav className="o-topnav">
      {/* Brand */}
      <Link href="/" className="o-topnav-brand">
        <div className="o-brand-icon">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
        <span className="o-brand-name">Saha Event</span>
        {role === 'admin' && (
          <span style={{ marginLeft: 8, background: 'linear-gradient(135deg, #DC3545, #C82333)', color: '#fff', fontSize: 9, padding: '2px 8px', borderRadius: 4, fontWeight: 'bold', letterSpacing: '.04em', textTransform: 'uppercase' }}>Admin</span>
        )}
        {role === 'owner' && (
          <span style={{ marginLeft: 8, background: 'linear-gradient(135deg, #0D47A1, #1565C0)', color: '#fff', fontSize: 9, padding: '2px 8px', borderRadius: 4, fontWeight: 'bold', letterSpacing: '.04em', textTransform: 'uppercase' }}>Owner</span>
        )}
      </Link>

      {/* App menu */}
      <div className="o-topnav-menu">
        {APPS.map(app => (
          <Link key={app.href} href={app.href} className={`o-topnav-item ${isActive(app.href) ? 'active' : ''}`}>
            {app.label}
          </Link>
        ))}
      </div>

      {/* Right actions */}
      <div className="o-topnav-right">
        {/* Notifications Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="o-icon-btn" title="Notifications" onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 16, height: 16, borderRadius: '50%',
                background: 'linear-gradient(135deg, #DC3545, #C82333)',
                color: '#fff', fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #1B1B1B',
                animation: 'o-pulse 2s ease-in-out infinite'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#fff', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: 340, zIndex: 1000, border: '1px solid #eee', maxHeight: 420, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>
                  Notifications {unreadCount > 0 && <span style={{ fontSize: 11, color: '#714B67', fontWeight: 600 }}>({unreadCount})</span>}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: 11, color: '#714B67', cursor: 'pointer', fontWeight: 600 }}>
                    Tout marquer lu
                  </button>
                )}
              </div>
              <div style={{ overflow: 'auto', flex: 1 }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', fontSize: 12, color: '#888', textAlign: 'center' }}>
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#ddd" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }}>
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    Aucune notification
                  </div>
                ) : (
                  notifications.map(n => {
                    const ni = getNotifIcon(n.type);
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.link) { router.push(n.link); setNotifOpen(false); }
                        }}
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid #f5f5f5',
                          cursor: 'pointer',
                          display: 'flex', gap: 10, alignItems: 'flex-start',
                          background: n.is_read ? 'transparent' : 'rgba(113,75,103,.04)',
                          transition: 'background .15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8f8f8')}
                        onMouseLeave={e => (e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(113,75,103,.04)')}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: ni.bg, color: ni.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2
                        }}>
                          {ni.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: n.is_read ? 500 : 700, color: '#333', marginBottom: 2 }}>
                            {n.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize: 10, color: '#bbb', marginTop: 3 }}>
                            {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {!n.is_read && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#714B67', flexShrink: 0, marginTop: 6 }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Night Mode */}
        <button className="o-icon-btn" title="Mode Nuit" onClick={toggleDarkMode}>
          {darkMode ? (
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Profile */}
        <div style={{ position: 'relative', marginLeft: 4 }} ref={profileRef}>
          <div
            className="o-user-avatar"
            title="Mon compte"
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            style={{ cursor: 'pointer' }}
            role="button"
          >
            {initials.toUpperCase()}
          </div>
          {profileOpen && (
            <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#fff', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', minWidth: 220, zIndex: 1000, border: '1px solid #eee' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee' }}>
                <div style={{ fontWeight: 700, color: '#333', fontSize: 14 }}>{name || 'Utilisateur'}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: role === 'admin' ? '#FDECEA' : role === 'owner' ? '#E3F2FD' : '#EBF6EC',
                    color: role === 'admin' ? '#DC3545' : role === 'owner' ? '#0D47A1' : '#1B5E20',
                    padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '.03em'
                  }}>
                    {role === 'admin' ? '🛡️' : role === 'owner' ? '🏢' : '👤'} {role}
                  </span>
                </div>
              </div>
              <div style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
                <Link href="/profile" className="o-topnav-item" style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', fontSize: 13, color: '#333', textDecoration: 'none' }} onClick={() => setProfileOpen(false)}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Mon Profil
                </Link>
                <Link href="/dashboard" className="o-topnav-item" style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', fontSize: 13, color: '#333', textDecoration: 'none' }} onClick={() => setProfileOpen(false)}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  Tableau de bord
                </Link>
                {role === 'admin' && (
                  <Link href="/admin" className="o-topnav-item" style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', fontSize: 13, color: '#714B67', textDecoration: 'none', fontWeight: 600 }} onClick={() => setProfileOpen(false)}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Administration
                  </Link>
                )}
                {role === 'owner' && (
                  <Link href="/owner/dashboard" className="o-topnav-item" style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', fontSize: 13, color: '#0D47A1', textDecoration: 'none', fontWeight: 600 }} onClick={() => setProfileOpen(false)}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Espace Propriétaire
                  </Link>
                )}
              </div>
              <div style={{ padding: '4px 0' }}>
                <button onClick={logout} style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#dc3545', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
