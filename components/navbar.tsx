"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Bell,
  LogOut,
  User,
  Building2,
  CalendarDays,
  Plus,
  Settings,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { NotificationsDropdown } from "./notifications-dropdown";

const NAV_LINKS = [
  { label: "Parcourir", href: "/parcourir" },
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "Propriétaires", href: "/#proprietaires" },
] as const;

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isLanding = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auth state listener
  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", authUser.id)
          .single();

        setUser({
          id: authUser.id,
          email: authUser.email || "",
          full_name: (profile as any)?.full_name || null,
          role: (profile as any)?.role || "CLIENT",
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showUserMenu]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setShowUserMenu(false);
    router.push("/");
    router.refresh();
  };

  const getDashboardLink = () => {
    if (!user) return "/espace-client";
    if (user.role === "OWNER") return "/espace-proprietaire";
    if (user.role === "ADMIN") return "/admin";
    return "/espace-client";
  };

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  // Quick-access button config based on role
  const getQuickAction = () => {
    if (!user) return null;
    if (user.role === "OWNER") return { label: "Mes salles", href: "/espace-proprietaire", icon: <Building2 size={14} strokeWidth={1.5} /> };
    if (user.role === "ADMIN") return { label: "Panel Admin", href: "/admin", icon: <Shield size={14} strokeWidth={1.5} /> };
    return { label: "Mes réservations", href: "/espace-client", icon: <CalendarDays size={14} strokeWidth={1.5} /> };
  };

  // Build contextual menu items based on role
  const getUserMenuItems = () => {
    if (!user) return [];

    const items: { label: string; href: string; icon: React.ReactNode }[] = [];

    if (user.role === "OWNER") {
      items.push(
        {
          label: "Tableau de bord",
          href: "/espace-proprietaire",
          icon: <LayoutDashboard size={14} strokeWidth={1.5} style={{ color: "var(--brass)" }} />,
        },
        {
          label: "Mes salles",
          href: "/espace-proprietaire",
          icon: <Building2 size={14} strokeWidth={1.5} style={{ color: "var(--brass)" }} />,
        },
        {
          label: "Ajouter une salle",
          href: "/ajouter-salle",
          icon: <Plus size={14} strokeWidth={1.5} style={{ color: "var(--brass)" }} />,
        },
      );
    } else if (user.role === "ADMIN") {
      items.push(
        {
          label: "Administration",
          href: "/admin",
          icon: <Shield size={14} strokeWidth={1.5} style={{ color: "var(--brass)" }} />,
        },
      );
    } else {
      // CLIENT
      items.push(
        {
          label: "Mon espace",
          href: "/espace-client",
          icon: <LayoutDashboard size={14} strokeWidth={1.5} style={{ color: "var(--brass)" }} />,
        },
        {
          label: "Mes réservations",
          href: "/espace-client",
          icon: <CalendarDays size={14} strokeWidth={1.5} style={{ color: "var(--brass)" }} />,
        },
      );
    }

    // Notifications — all roles
    items.push({
      label: "Notifications",
      href: "/notifications",
      icon: <Bell size={14} strokeWidth={1.5} style={{ color: "var(--brass)" }} />,
    });

    // Settings for all roles
    items.push({
      label: "Paramètres",
      href: getDashboardLink(),
      icon: <Settings size={14} strokeWidth={1.5} style={{ color: "var(--brass)" }} />,
    });

    return items;
  };

  const showSolidBg = !isLanding || scrolled;

  const menuItemStyle = {
    padding: "10px 16px",
    color: "var(--bone)",
    fontSize: 13,
    transition: "background 0.15s",
    display: "flex",
    alignItems: "center",
    gap: 10,
  } as const;

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 transition-colors duration-300"
        style={{
          zIndex: "var(--z-navbar)",
          height: 68,
          backgroundColor: showSolidBg ? "var(--obsidian)" : "transparent",
          borderBottom: showSolidBg
            ? "1px solid rgba(168, 124, 62, 0.15)"
            : "1px solid transparent",
        }}
      >
        <div className="container-saha h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-baseline gap-0.5 no-underline"
            aria-label="Saha·Event — Accueil"
          >
            <span
              className="font-display italic text-[22px]"
              style={{ color: "var(--brass)" }}
            >
              Saha
            </span>
            <span
              className="font-sans text-[22px]"
              style={{ fontWeight: 300, color: "var(--bone)" }}
            >
              Event
            </span>
          </Link>

          {/* Desktop nav links — center */}
          <div className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link-hover text-label no-underline transition-colors duration-200"
                style={{ fontSize: 12, fontWeight: 500 }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth section — right */}
          <div className="hidden lg:flex items-center gap-3">
            {loading ? (
              <div style={{ width: 80, height: 40 }} />
            ) : user ? (
              <>
                {/* Role-based quick-access button */}
                {(() => {
                  const qa = getQuickAction();
                  if (!qa) return null;
                  return (
                    <Link
                      href={qa.href}
                      className="no-underline flex items-center gap-2"
                      style={{
                        height: 36,
                        padding: "0 14px",
                        borderRadius: 6,
                        border: "1px solid rgba(168,124,62,0.25)",
                        background: "rgba(168,124,62,0.06)",
                        color: "var(--brass)",
                        fontSize: 12,
                        fontWeight: 500,
                        letterSpacing: "0.03em",
                        transition: "all 0.2s ease",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(168,124,62,0.12)";
                        e.currentTarget.style.borderColor = "rgba(168,124,62,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(168,124,62,0.06)";
                        e.currentTarget.style.borderColor = "rgba(168,124,62,0.25)";
                      }}
                    >
                      {qa.icon}
                      {qa.label}
                    </Link>
                  );
                })()}

                {/* Notification Bell */}
                <NotificationsDropdown />

                {/* User Avatar & Menu */}
                <div className="relative" data-user-menu>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(168,124,62,0.15)",
                      border: "1px solid rgba(168,124,62,0.3)",
                      color: "var(--brass)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "var(--font-manrope)",
                      transition: "all 0.2s ease",
                    }}
                    aria-label="Menu utilisateur"
                  >
                    {getInitials()}
                  </button>

                  {showUserMenu && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        width: 240,
                        background: "var(--obsidian)",
                        border: "1px solid rgba(168,124,62,0.2)",
                        borderRadius: 12,
                        padding: "8px 0",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        zIndex: 100,
                      }}
                    >
                      {/* User info */}
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(168,124,62,0.1)" }}>
                        <p style={{ color: "var(--bone)", fontSize: 14, fontWeight: 500, margin: 0 }}>
                          {user.full_name || "Utilisateur"}
                        </p>
                        <p style={{ color: "var(--stone)", fontSize: 12, margin: "2px 0 0" }}>
                          {user.email}
                        </p>
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 6,
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            background: user.role === "OWNER"
                              ? "rgba(168,124,62,0.15)"
                              : user.role === "ADMIN"
                                ? "rgba(139,46,32,0.15)"
                                : "rgba(255,255,255,0.05)",
                            color: user.role === "OWNER"
                              ? "var(--brass)"
                              : user.role === "ADMIN"
                                ? "var(--pomegranate)"
                                : "var(--stone)",
                          }}
                        >
                          {user.role === "OWNER" ? "Propriétaire" : user.role === "ADMIN" ? "Admin" : "Client"}
                        </span>
                      </div>

                      {/* Role-specific links */}
                      {getUserMenuItems().map((item) => (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          onClick={() => setShowUserMenu(false)}
                          className="no-underline"
                          style={menuItemStyle}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(168,124,62,0.08)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}

                      {/* Separator */}
                      <div style={{ height: 1, background: "rgba(168,124,62,0.1)", margin: "4px 0" }} />

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full"
                        style={{
                          padding: "10px 16px",
                          color: "var(--pomegranate)",
                          fontSize: 13,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,46,32,0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <LogOut size={14} strokeWidth={1.5} />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary no-underline" style={{ height: 40, fontSize: 12 }}>
                  Connexion
                </Link>
                <Link href="/signup" className="btn-primary no-underline" style={{ height: 40, fontSize: 12 }}>
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex items-center justify-center"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--bone)",
              cursor: "pointer",
              padding: 8,
            }}
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center"
          style={{
            zIndex: "var(--z-overlay)",
            backgroundColor: "var(--obsidian)",
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-5 right-5"
            aria-label="Fermer le menu"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--bone)",
              cursor: "pointer",
              padding: 8,
            }}
          >
            <X size={24} strokeWidth={1.5} />
          </button>

          {/* Mobile links */}
          <div className="flex flex-col items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-label no-underline"
                style={{
                  color: "var(--bone)",
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                }}
              >
                {link.label}
              </Link>
            ))}

            <hr
              className="w-12"
              style={{ border: "none", borderTop: "1px solid rgba(168,124,62,0.3)" }}
            />

            {user ? (
              <>
                {/* User info */}
                <div className="text-center mb-2">
                  <p style={{ color: "var(--bone)", fontSize: 14, fontWeight: 500, margin: 0 }}>
                    {user.full_name || "Utilisateur"}
                  </p>
                  <p style={{ color: "var(--stone)", fontSize: 12, margin: "4px 0 0" }}>
                    {user.role === "OWNER" ? "Propriétaire" : user.role === "ADMIN" ? "Admin" : "Client"}
                  </p>
                </div>

                {/* Role-specific mobile links */}
                {getUserMenuItems().map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="no-underline flex items-center gap-3"
                    style={{
                      color: "var(--bone)",
                      fontSize: 13,
                      fontWeight: 400,
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}

                <hr
                  className="w-8"
                  style={{ border: "none", borderTop: "1px solid rgba(168,124,62,0.2)" }}
                />

                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="btn-secondary"
                  style={{ color: "var(--pomegranate)", borderColor: "var(--pomegranate)" }}
                >
                  <LogOut size={14} strokeWidth={1.5} />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-secondary no-underline"
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary no-underline"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
