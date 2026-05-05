"use client";

import { useState, useTransition } from "react";
import {
  Shield,
  Users,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  MapPin,
  LogOut,
  Loader2,
} from "lucide-react";
import { updateKYCStatus } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

interface AdminStats {
  total_owners: number;
  total_venues: number;
  pending_approvals: number;
  active_reservations: number;
}

interface PendingOwner {
  id: string;
  full_name: string;
  role: string;
  kyc_status: string;
  created_at: string;
  phone?: string;
}

interface PendingVenue {
  id: string;
  name: string;
  wilaya: string;
  capacity_max: number;
  price_per_day: number;
  status: string;
  created_at: string;
  owner_name: string;
}

type Tab = "overview" | "owners" | "venues";

export default function AdminDashboard({
  stats,
  pendingOwners,
  pendingVenues,
}: {
  stats: AdminStats;
  pendingOwners: PendingOwner[];
  pendingVenues: PendingVenue[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const handleApprove = (profileId: string) => {
    setProcessingId(profileId);
    startTransition(async () => {
      const result = await updateKYCStatus(profileId, "APPROVED");
      if (result?.error) {
        alert("Erreur: " + result.error);
      }
      setProcessingId(null);
      router.refresh();
    });
  };

  const handleReject = (profileId: string) => {
    const reason = prompt("Motif du rejet (optionnel):");
    setProcessingId(profileId);
    startTransition(async () => {
      const result = await updateKYCStatus(profileId, "REJECTED", reason || undefined);
      if (result?.error) {
        alert("Erreur: " + result.error);
      }
      setProcessingId(null);
      router.refresh();
    });
  };

  return (
    <section className="section-obsidian" style={{ paddingTop: 68, minHeight: "100vh" }}>
      <div className="container-saha" style={{ paddingTop: 60, paddingBottom: 120 }}>
        {/* Header */}
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} strokeWidth={1.5} style={{ color: "var(--pomegranate)" }} />
              <p className="text-caption" style={{ color: "var(--pomegranate)", margin: 0 }}>
                Administration
              </p>
            </div>
            <h1 style={{ color: "var(--bone)", fontSize: "clamp(28px, 4vw, 40px)" }}>
              Panneau Admin
            </h1>
          </div>
          <a href="/login" className="btn-ghost no-underline" style={{ color: "var(--stone)", gap: 6 }}>
            <LogOut size={14} strokeWidth={1.5} />
            Déconnexion
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-12" style={{ borderBottom: "1px solid rgba(168,124,62,0.15)" }}>
          {(
            [
              { key: "overview", label: "Tableau de bord", icon: BarChart3 },
              { key: "owners", label: "Propriétaires", icon: Users, count: pendingOwners.length },
              { key: "venues", label: "Salles", icon: Building2, count: pendingVenues.length },
            ] as const
          ).map(({ key, label, icon: Icon, ...rest }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="text-caption flex items-center gap-2"
              style={{
                padding: "14px 24px",
                background: "transparent",
                border: "none",
                borderBottom: tab === key ? "2px solid var(--brass)" : "2px solid transparent",
                color: tab === key ? "var(--brass)" : "var(--stone)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={14} strokeWidth={1.5} />
              {label}
              {"count" in rest && (rest as { count: number }).count > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor: "var(--pomegranate)",
                    color: "var(--bone)",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {(rest as { count: number }).count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {[
                { label: "Propriétaires", value: stats.total_owners, icon: Users },
                { label: "Salles totales", value: stats.total_venues, icon: Building2 },
                { label: "En attente", value: stats.pending_approvals, icon: AlertTriangle, accent: true },
                { label: "Réservations actives", value: stats.active_reservations, icon: Calendar },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: "24px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.02)",
                    border: stat.accent
                      ? "1px solid rgba(139,46,32,0.3)"
                      : "1px solid rgba(168,124,62,0.1)",
                  }}
                >
                  <stat.icon
                    size={18}
                    strokeWidth={1.5}
                    style={{ color: stat.accent ? "var(--pomegranate)" : "var(--brass)", marginBottom: 12 }}
                  />
                  <p className="text-mono" style={{ fontSize: 28, color: stat.accent ? "var(--pomegranate)" : "var(--candlelight)", marginBottom: 4 }}>
                    {stat.value}
                  </p>
                  <p className="text-caption" style={{ color: "var(--stone)", margin: 0 }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {stats.pending_approvals > 0 && (
              <div
                style={{
                  padding: "20px 24px",
                  borderRadius: 6,
                  background: "rgba(139,46,32,0.06)",
                  border: "1px solid rgba(139,46,32,0.15)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} strokeWidth={1.5} style={{ color: "var(--pomegranate)" }} />
                  <p className="text-label" style={{ color: "var(--pomegranate)", margin: 0 }}>
                    Actions requises
                  </p>
                </div>
                <p className="text-body" style={{ color: "var(--stone)", margin: 0 }}>
                  {pendingOwners.length} propriétaire(s) et {pendingVenues.length} salle(s) en attente de validation.
                </p>
              </div>
            )}

            {stats.pending_approvals === 0 && (
              <div
                style={{
                  padding: "20px 24px",
                  borderRadius: 6,
                  background: "rgba(46,82,64,0.06)",
                  border: "1px solid rgba(46,82,64,0.15)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} strokeWidth={1.5} style={{ color: "var(--malachite)" }} />
                  <p className="text-label" style={{ color: "var(--malachite)", margin: 0 }}>
                    Tout est à jour
                  </p>
                </div>
                <p className="text-body" style={{ color: "var(--stone)", margin: 0 }}>
                  Aucune action en attente.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Owners */}
        {tab === "owners" && (
          <div className="flex flex-col gap-4">
            <p className="text-body mb-4" style={{ color: "var(--stone)" }}>
              Propriétaires en attente de validation du compte.
            </p>
            {pendingOwners.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <CheckCircle size={32} strokeWidth={1} style={{ color: "var(--malachite)", margin: "0 auto 12px" }} />
                <p className="text-body" style={{ color: "var(--stone)" }}>
                  Aucun propriétaire en attente.
                </p>
              </div>
            )}
            {pendingOwners.map((owner) => (
              <div
                key={owner.id}
                style={{
                  padding: "28px 32px",
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(168,124,62,0.1)",
                  opacity: processingId === owner.id ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 style={{ color: "var(--bone)", fontSize: 15, margin: 0 }}>
                        {owner.full_name || "Sans nom"}
                      </h3>
                      <span className="badge badge-brass">
                        <Clock size={11} strokeWidth={1.5} />
                        En attente
                      </span>
                    </div>
                    <p style={{ color: "var(--stone)", fontSize: 13, margin: "0 0 4px" }}>
                      Rôle: {owner.role}
                    </p>
                    {owner.phone && (
                      <p style={{ color: "var(--stone)", fontSize: 12, margin: 0, opacity: 0.7 }}>
                        Tél: {owner.phone}
                      </p>
                    )}
                    <p className="text-mono" style={{ fontSize: 11, color: "var(--stone)", marginTop: 6, opacity: 0.6 }}>
                      Inscrit le {new Date(owner.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-primary"
                      style={{ height: 36, fontSize: 11, padding: "0 16px" }}
                      onClick={() => handleApprove(owner.id)}
                      disabled={isPending}
                    >
                      {processingId === owner.id ? (
                        <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                      ) : (
                        <CheckCircle size={13} strokeWidth={1.5} />
                      )}
                      Valider
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ height: 36, fontSize: 11, padding: "0 16px", color: "var(--pomegranate)", borderColor: "var(--pomegranate)" }}
                      onClick={() => handleReject(owner.id)}
                      disabled={isPending}
                    >
                      <XCircle size={13} strokeWidth={1.5} />
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Venues */}
        {tab === "venues" && (
          <div className="flex flex-col gap-4">
            <p className="text-body mb-4" style={{ color: "var(--stone)" }}>
              Salles en attente de vérification et publication.
            </p>
            {pendingVenues.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <CheckCircle size={32} strokeWidth={1} style={{ color: "var(--malachite)", margin: "0 auto 12px" }} />
                <p className="text-body" style={{ color: "var(--stone)" }}>
                  Aucune salle en attente.
                </p>
              </div>
            )}
            {pendingVenues.map((venue) => (
              <div
                key={venue.id}
                style={{
                  padding: "28px 32px",
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(168,124,62,0.1)",
                }}
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h3 style={{ color: "var(--bone)", fontSize: 15, margin: "0 0 4px" }}>
                      {venue.name}
                    </h3>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="flex items-center gap-1" style={{ color: "var(--stone)", fontSize: 13 }}>
                        <MapPin size={12} strokeWidth={1.5} />
                        {venue.wilaya}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: "var(--stone)", fontSize: 13 }}>
                        <Users size={12} strokeWidth={1.5} />
                        {venue.capacity_max}
                      </span>
                      <span className="text-mono" style={{ fontSize: 13, color: "var(--brass)" }}>
                        {venue.price_per_day?.toLocaleString("fr-DZ")} DA
                      </span>
                    </div>
                    <p style={{ color: "var(--stone)", fontSize: 12, margin: 0, opacity: 0.7 }}>
                      Propriétaire: {venue.owner_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/salle/${venue.id}`}
                      className="btn-ghost no-underline"
                      style={{ color: "var(--stone)", height: 36 }}
                      target="_blank"
                    >
                      Aperçu
                    </a>
                    <button className="btn-primary" style={{ height: 36, fontSize: 11, padding: "0 16px" }}>
                      <CheckCircle size={13} strokeWidth={1.5} />
                      Approuver
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ height: 36, fontSize: 11, padding: "0 16px", color: "var(--pomegranate)", borderColor: "var(--pomegranate)" }}
                    >
                      <XCircle size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
