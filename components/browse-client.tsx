"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  MapPin,
  Users,
  Star,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

/* ── Types ── */
interface BrowseVenue {
  id: string;
  name: string;
  wilaya: string;
  address: string;
  price_per_day: number;
  capacity_max: number;
  rating: number;
  reviews: number;
  image: string;
}

export function BrowseClient({
  venues,
  wilayas,
}: {
  venues: BrowseVenue[];
  wilayas: string[];
}) {
  const [search, setSearch] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState("Toutes");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "rating" | "capacity">("rating");
  const sectionRef = useRef<HTMLDivElement>(null);

  const filtered = venues
    .filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.wilaya.toLowerCase().includes(search.toLowerCase());
      const matchWilaya =
        selectedWilaya === "Toutes" || v.wilaya === selectedWilaya;
      return matchSearch && matchWilaya;
    })
    .sort((a, b) => {
      if (sortBy === "price") return a.price_per_day - b.price_per_day;
      if (sortBy === "rating") return b.rating - a.rating;
      return b.capacity_max - a.capacity_max;
    });

  // Fade-up observer — re-run when filtered results change
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    
    let observer: IntersectionObserver;
    
    // Small delay to let React render new cards first
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("visible");
            }
          });
        },
        { threshold: 0.1 }
      );
      
      // Observe header elements, not the dynamic cards
      el.querySelectorAll("h1.fade-up, p.fade-up").forEach((child) => {
        if (!child.classList.contains("visible")) {
          observer.observe(child);
        }
      });
    }, 50);
    
    return () => {
      clearTimeout(timer);
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <div ref={sectionRef}>
      {/* Header section */}
      <section
        className="section-obsidian"
        style={{ paddingTop: 120, paddingBottom: 60 }}
      >
        <div className="container-saha">
          <p className="text-caption fade-up mb-4" style={{ color: "var(--brass)" }}>
            Collection
          </p>
          <h1 className="fade-up" style={{ color: "var(--bone)", marginBottom: 16 }}>
            Parcourir les salles
          </h1>
          <p
            className="text-body fade-up"
            style={{ color: "var(--stone)", maxWidth: 500 }}
          >
            Explorez notre sélection de salles des fêtes vérifiées à travers
            toute l&apos;Algérie.
          </p>
        </div>
      </section>

      {/* Search + Filters bar */}
      <section
        style={{
          backgroundColor: "var(--obsidian)",
          borderBottom: "1px solid rgba(168,124,62,0.15)",
          position: "sticky",
          top: 68,
          zIndex: "var(--z-sticky)" as unknown as number,
        }}
      >
        <div
          className="container-saha flex items-center gap-4 flex-wrap"
          style={{ padding: "16px 48px" }}
        >
          {/* Search input */}
          <div
            className="relative flex-1"
            style={{ minWidth: 240, maxWidth: 400 }}
          >
            <Search
              size={16}
              strokeWidth={1.5}
              className="absolute left-0 top-1/2 -translate-y-1/2"
              style={{ color: "var(--stone)" }}
            />
            <input
              type="text"
              placeholder="Rechercher par nom ou wilaya..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-saha"
              style={{
                paddingLeft: 28,
                fontSize: 14,
                borderBottomColor: "rgba(232, 223, 208, 0.25)",
                color: "var(--bone)",
              }}
            />
          </div>

          {/* Wilaya pills — desktop */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap">
            {wilayas.slice(0, 6).map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWilaya(w)}
                className="text-caption"
                style={{
                  padding: "6px 14px",
                  borderRadius: 24,
                  border:
                    selectedWilaya === w
                      ? "1px solid var(--brass)"
                      : "1px solid rgba(168,124,62,0.15)",
                  background:
                    selectedWilaya === w
                      ? "rgba(168,124,62,0.15)"
                      : "transparent",
                  color:
                    selectedWilaya === w ? "var(--brass)" : "var(--stone)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontSize: 10,
                }}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
            style={{
              background: "transparent",
              border: "1px solid rgba(168,124,62,0.2)",
              color: "var(--stone)",
              padding: "6px 14px",
              borderRadius: 24,
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "var(--font-manrope)",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <SlidersHorizontal size={14} strokeWidth={1.5} />
            Filtres
          </button>
        </div>

        {/* Expanded filters panel */}
        {showFilters && (
          <div
            className="container-saha"
            style={{
              padding: "20px 48px 24px",
              borderTop: "1px solid rgba(168,124,62,0.1)",
            }}
          >
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-caption" style={{ color: "var(--stone)", fontSize: 10 }}>
                  Trier par
                </span>
                <div className="flex gap-1">
                  {(
                    [
                      { key: "rating", label: "Note" },
                      { key: "price", label: "Prix" },
                      { key: "capacity", label: "Capacité" },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className="text-caption"
                      style={{
                        padding: "4px 10px",
                        borderRadius: 24,
                        border: "none",
                        background:
                          sortBy === key
                            ? "var(--brass)"
                            : "rgba(168,124,62,0.1)",
                        color:
                          sortBy === key ? "var(--bone)" : "var(--stone)",
                        cursor: "pointer",
                        fontSize: 10,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile wilayas */}
              <div className="lg:hidden flex items-center gap-2 flex-wrap">
                {wilayas.map((w) => (
                  <button
                    key={w}
                    onClick={() => setSelectedWilaya(w)}
                    className="text-caption"
                    style={{
                      padding: "4px 10px",
                      borderRadius: 24,
                      border:
                        selectedWilaya === w
                          ? "1px solid var(--brass)"
                          : "1px solid rgba(168,124,62,0.15)",
                      background:
                        selectedWilaya === w
                          ? "rgba(168,124,62,0.15)"
                          : "transparent",
                      color:
                        selectedWilaya === w ? "var(--brass)" : "var(--stone)",
                      cursor: "pointer",
                      fontSize: 10,
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Results */}
      <section className="section-alabaster section-pad">
        <div className="container-saha">
          {/* Results count */}
          <p
            className="text-mono fade-up mb-10"
            style={{ fontSize: 13, color: "var(--stone)" }}
          >
            {filtered.length} salle{filtered.length !== 1 ? "s" : ""} trouvée
            {filtered.length !== 1 ? "s" : ""}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center" style={{ padding: "80px 0" }}>
              <p
                className="text-body"
                style={{ color: "var(--stone)", fontSize: 18 }}
              >
                Aucune salle ne correspond à vos critères.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedWilaya("Toutes");
                }}
                className="btn-ghost mt-4"
                style={{ color: "var(--brass)" }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div
              className="grid gap-8"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              }}
            >
              {filtered.map((venue) => (
                <BrowseVenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ── Browse Venue Card ── */
function BrowseVenueCard({ venue }: { venue: BrowseVenue }) {
  return (
    <Link
      href={`/salle/${venue.id}`}
      className="group block no-underline venue-card-hover"
      style={{
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "white",
        boxShadow: "0 2px 12px rgba(14,12,9,0.06)",
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
      }}
    >
      {/* Image */}
      <div className="relative" style={{ height: 220, overflow: "hidden" }}>
        <Image
          src={venue.image}
          alt={venue.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {/* Rating badge */}
        <div
          className="absolute top-4 right-4 flex items-center gap-1"
          style={{
            background: "rgba(14,12,9,0.75)",
            backdropFilter: "blur(8px)",
            padding: "4px 10px",
            borderRadius: 24,
          }}
        >
          <Star size={11} fill="var(--candlelight)" color="var(--candlelight)" />
          <span
            className="text-mono"
            style={{ fontSize: 12, color: "var(--candlelight)" }}
          >
            {venue.rating.toFixed(1)}
          </span>
          <span style={{ fontSize: 10, color: "var(--stone)", marginLeft: 2 }}>
            ({venue.reviews})
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 24px 24px" }}>
        <h3
          style={{
            color: "var(--obsidian)",
            fontSize: 15,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 8,
          }}
        >
          {venue.name}
        </h3>

        <div className="flex items-center gap-4 mb-4">
          <span
            className="flex items-center gap-1"
            style={{
              color: "var(--stone)",
              fontSize: 13,
              fontFamily: "var(--font-manrope)",
              fontWeight: 300,
            }}
          >
            <MapPin size={13} strokeWidth={1.5} />
            {venue.wilaya}
          </span>
          <span
            className="flex items-center gap-1"
            style={{
              color: "var(--stone)",
              fontSize: 13,
              fontFamily: "var(--font-manrope)",
              fontWeight: 300,
            }}
          >
            <Users size={13} strokeWidth={1.5} />
            {venue.capacity_max} places
          </span>
        </div>

        <div
          className="flex items-baseline justify-between"
          style={{
            borderTop: "1px solid rgba(14,12,9,0.06)",
            paddingTop: 16,
          }}
        >
          <p className="text-mono" style={{ fontSize: 16, color: "var(--brass)", margin: 0 }}>
            {venue.price_per_day.toLocaleString("fr-DZ")} DA
            <span style={{ fontSize: 11, color: "var(--stone)", marginLeft: 4 }}>
              / jour
            </span>
          </p>
          <span
            className="text-caption"
            style={{
              color: "var(--brass)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Voir
            <ChevronDown
              size={12}
              strokeWidth={1.5}
              style={{ transform: "rotate(-90deg)" }}
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
