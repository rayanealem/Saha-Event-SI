"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  User,
  ArrowRight,
  MapPin,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  PENDING: { label: "En attente", badge: "badge-brass", icon: Clock },
  CONFIRMED: { label: "Confirmée", badge: "badge-malachite", icon: CheckCircle },
  CANCELLED: { label: "Annulée", badge: "badge-pomegranate", icon: XCircle },
  COMPLETED: { label: "Terminée", badge: "badge-stone", icon: CheckCircle },
  RECEIPT_INVALID: { label: "Reçu invalide", badge: "badge-pomegranate", icon: AlertCircle },
};

type Tab = "reservations" | "profile";

interface Reservation {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  deposit_amount: number;
  status: string;
  reference_code: string;
  created_at: string;
  venues: { name: string; wilaya: string } | null;
}

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  kyc_status: string;
}

export function EspaceClientContent({
  profile,
  reservations,
}: {
  profile: Profile;
  reservations: Reservation[];
}) {
  const [tab, setTab] = useState<Tab>("reservations");

  return (
    <section className="section-obsidian" style={{ paddingTop: 68, minHeight: "100vh" }}>
      <div className="container-saha" style={{ paddingTop: 60, paddingBottom: 120 }}>
        {/* Header */}
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-caption mb-3" style={{ color: "var(--brass)" }}>
              Mon espace
            </p>
            <h1 style={{ color: "var(--bone)", fontSize: "clamp(28px, 4vw, 40px)" }}>
              Bonjour, {profile.full_name || "Client"}
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-0 mb-12"
          style={{ borderBottom: "1px solid rgba(168,124,62,0.15)" }}
        >
          {(
            [
              { key: "reservations", label: "Mes réservations", icon: Calendar },
              { key: "profile", label: "Mon profil", icon: User },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="text-caption flex items-center gap-2"
              style={{
                padding: "14px 24px",
                background: "transparent",
                border: "none",
                borderBottom:
                  tab === key
                    ? "2px solid var(--brass)"
                    : "2px solid transparent",
                color: tab === key ? "var(--brass)" : "var(--stone)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={14} strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "reservations" && (
          <div>
            {reservations.length === 0 ? (
              <div className="text-center" style={{ padding: "80px 0" }}>
                <Calendar
                  size={40}
                  strokeWidth={1}
                  style={{ color: "var(--stone)", margin: "0 auto 16px" }}
                />
                <p className="text-body" style={{ color: "var(--stone)" }}>
                  Vous n&apos;avez aucune réservation pour le moment.
                </p>
                <Link
                  href="/parcourir"
                  className="btn-primary no-underline mt-6 inline-flex"
                >
                  Explorer les salles
                  <ArrowRight size={16} strokeWidth={1.5} />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reservations.map((res) => {
                  const config = STATUS_CONFIG[res.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = config.icon;
                  const venueName = res.venues?.name || "Salle";
                  const wilaya = res.venues?.wilaya || "";
                  return (
                    <div key={res.id} className="reservation-card">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex-1" style={{ minWidth: 240 }}>
                          <div className="flex items-center gap-3 mb-2">
                            <h3
                              style={{
                                color: "var(--bone)",
                                fontSize: 15,
                                margin: 0,
                              }}
                            >
                              {venueName}
                            </h3>
                            <span className={`badge ${config.badge}`}>
                              <StatusIcon size={11} strokeWidth={1.5} />
                              {config.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mb-3">
                            {wilaya && (
                              <span
                                className="flex items-center gap-1"
                                style={{ color: "var(--stone)", fontSize: 13 }}
                              >
                                <MapPin size={12} strokeWidth={1.5} />
                                {wilaya}
                              </span>
                            )}
                            <span
                              className="flex items-center gap-1"
                              style={{ color: "var(--stone)", fontSize: 13 }}
                            >
                              <Calendar size={12} strokeWidth={1.5} />
                              {new Date(res.start_date + "T00:00:00").toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>

                          <p
                            className="text-mono"
                            style={{
                              fontSize: 11,
                              color: "var(--stone)",
                              margin: 0,
                            }}
                          >
                            Réf: {res.reference_code}
                          </p>
                        </div>

                        <div className="text-right">
                          <p
                            className="text-mono"
                            style={{
                              fontSize: 20,
                              color: "var(--candlelight)",
                              margin: 0,
                            }}
                          >
                            {res.total_price?.toLocaleString("fr-DZ")} DA
                          </p>
                          <p
                            className="text-caption mt-1"
                            style={{ color: "var(--stone)", margin: 0 }}
                          >
                            Acompte: {res.deposit_amount?.toLocaleString("fr-DZ")} DA
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div style={{ maxWidth: 500 }}>
            <div className="flex flex-col gap-6">
              <div>
                <label
                  className="text-label mb-1 block"
                  style={{ color: "var(--stone)" }}
                >
                  Nom complet
                </label>
                <input
                  type="text"
                  defaultValue={profile.full_name || ""}
                  className="input-saha"
                  style={{ color: "var(--bone)" }}
                />
              </div>
              <div>
                <label
                  className="text-label mb-1 block"
                  style={{ color: "var(--stone)" }}
                >
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  defaultValue={profile.email || ""}
                  className="input-saha"
                  style={{ color: "var(--bone)" }}
                  disabled
                />
              </div>
              <div>
                <label
                  className="text-label mb-1 block"
                  style={{ color: "var(--stone)" }}
                >
                  Téléphone
                </label>
                <input
                  type="tel"
                  defaultValue={profile.phone || ""}
                  className="input-saha"
                  style={{ color: "var(--bone)" }}
                />
              </div>
              <button
                className="btn-primary"
                style={{ alignSelf: "flex-start", marginTop: 16 }}
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
