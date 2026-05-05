"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Star, MapPin, Users } from "lucide-react";

/* ── Intersection Observer for fade-up reveals ── */
function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    el.querySelectorAll(".fade-up").forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Types ── */
interface FeaturedVenue {
  id: string;
  name: string;
  wilaya: string;
  price: number;
  capacity: number;
  rating: number;
  image: string;
}

const STEPS = [
  {
    num: "01",
    title: "Explorez",
    desc: "Parcourez notre collection de salles d'exception vérifiées à travers toute l'Algérie. Filtrez par wilaya, capacité et budget.",
  },
  {
    num: "02",
    title: "Réservez",
    desc: "Choisissez vos dates, envoyez votre demande et recevez la confirmation du propriétaire directement sur la plateforme.",
  },
  {
    num: "03",
    title: "Célébrez",
    desc: "Votre salle est réservée. Préparez votre événement en toute sérénité avec un suivi complet jusqu'au jour J.",
  },
];

const STATS = [
  { value: "500+", label: "Salles vérifiées" },
  { value: "48", label: "Wilayas couvertes" },
  { value: "12K+", label: "Réservations réussies" },
  { value: "4.8", label: "Note moyenne" },
];

export function HomeClient({ venues }: { venues: FeaturedVenue[] }) {
  const sectionRef = useFadeUp();

  // Deterministic image assignment based on index
  const venuesWithImages = venues.map((v, i) => ({
    ...v,
    image: `/images/venue-${(i % 3) + 1}.png`,
  }));

  return (
    <div ref={sectionRef}>
      {/* ════════════════════════════════════════════
          HERO — Full-bleed cinematic
          ════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "100vh", backgroundColor: "var(--obsidian)" }}
      >
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero.png"
            alt="Salle des fêtes luxueuse en Algérie"
            fill
            priority
            className="object-cover"
            style={{ opacity: 0.4 }}
            sizes="100vw"
          />
          {/* Gradient overlays for depth */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, var(--obsidian) 0%, transparent 30%, transparent 60%, var(--obsidian) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, var(--obsidian) 0%, transparent 50%)",
            }}
          />
        </div>

        {/* Hero content — asymmetric left-aligned */}
        <div
          className="relative container-saha flex flex-col justify-end"
          style={{ minHeight: "100vh", paddingBottom: 120, paddingTop: 120 }}
        >
          <div style={{ maxWidth: 680 }}>
            <p
              className="text-caption fade-up mb-6"
              style={{ color: "var(--brass)" }}
            >
              ● Plateforme N°1 en Algérie
            </p>

            <h1 className="fade-up" style={{ color: "var(--bone)", marginBottom: 32 }}>
              L&apos;art de
              <br />
              <span style={{ color: "var(--brass)" }}>célébrer</span>
            </h1>

            <p
              className="text-body fade-up"
              style={{
                color: "var(--bone)",
                maxWidth: 440,
                opacity: 0.7,
                marginBottom: 48,
                lineHeight: 1.9,
              }}
            >
              Découvrez les plus belles salles des fêtes d&apos;Algérie.
              Chaque espace est vérifié, chaque moment est sacré.
            </p>

            <div className="flex flex-wrap gap-4 fade-up">
              <Link href="/parcourir" className="btn-primary no-underline">
                Explorer les salles
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
              <Link
                href="#comment-ca-marche"
                className="btn-secondary no-underline"
              >
                Comment ça marche
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 fade-up"
            style={{ opacity: 0.4 }}
          >
            <span
              className="text-caption"
              style={{ color: "var(--bone)", fontSize: 9 }}
            >
              Défiler
            </span>
            <div
              style={{
                width: 1,
                height: 40,
                background:
                  "linear-gradient(to bottom, var(--brass), transparent)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FEATURED VENUES — Asymmetric editorial grid
          ════════════════════════════════════════════ */}
      <section className="section-alabaster section-pad">
        <div className="container-saha">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
            <div>
              <p
                className="text-caption fade-up mb-4"
                style={{ color: "var(--brass)" }}
              >
                Sélection éditoriale
              </p>
              <h2
                className="fade-up"
                style={{ color: "var(--obsidian)" }}
              >
                Salles en vedette
              </h2>
            </div>
            <Link
              href="/parcourir"
              className="btn-ghost fade-up no-underline"
              style={{ color: "var(--brass)" }}
            >
              Voir toutes les salles
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>

          {venuesWithImages.length > 0 ? (
            <>
              {/* Desktop: asymmetric layout */}
              <div
                className="hidden md:grid fade-up"
                style={{
                  gridTemplateColumns: "1.4fr 1fr",
                  gridTemplateRows: "1fr 1fr",
                  gap: 20,
                  height: 600,
                }}
              >
                {/* Large card — spans 2 rows */}
                {venuesWithImages[0] && (
                  <VenueCard venue={venuesWithImages[0]} large />
                )}

                {/* Two stacked cards */}
                {venuesWithImages[1] && (
                  <VenueCard venue={venuesWithImages[1]} />
                )}
                {venuesWithImages[2] && (
                  <VenueCard venue={venuesWithImages[2]} />
                )}
              </div>

              {/* Mobile: single column */}
              <div className="md:hidden flex flex-col gap-5">
                {venuesWithImages.map((v) => (
                  <VenueCard key={v.id} venue={v} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center fade-up" style={{ padding: "60px 0" }}>
              <p className="text-body" style={{ color: "var(--stone)" }}>
                Les salles seront bientôt disponibles.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STATS STRIP — Monospaced numbers
          ════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: "var(--obsidian)",
          borderTop: "1px solid rgba(168,124,62,0.15)",
          borderBottom: "1px solid rgba(168,124,62,0.15)",
        }}
      >
        <div className="container-saha" style={{ padding: "64px 48px" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center fade-up">
                <p
                  className="text-mono"
                  style={{
                    fontSize: 40,
                    color: "var(--candlelight)",
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-caption"
                  style={{ color: "var(--stone)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          HOW IT WORKS — Editorial numbered steps
          ════════════════════════════════════════════ */}
      <section
        id="comment-ca-marche"
        className="section-obsidian section-pad"
      >
        <div className="container-saha">
          <div className="text-center mb-20">
            <p
              className="text-caption fade-up mb-4"
              style={{ color: "var(--brass)" }}
            >
              Le processus
            </p>
            <h2
              className="fade-up"
              style={{ color: "var(--bone)" }}
            >
              Comment ça marche
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="fade-up relative"
                style={{
                  padding: "48px 40px",
                  borderLeft:
                    i > 0 ? "1px solid rgba(168,124,62,0.15)" : "none",
                }}
              >
                {/* Step number */}
                <p
                  className="text-mono"
                  style={{
                    fontSize: 80,
                    color: "rgba(168,124,62,0.1)",
                    lineHeight: 1,
                    position: "absolute",
                    top: 20,
                    right: 30,
                  }}
                >
                  {step.num}
                </p>

                <p
                  className="text-mono mb-6"
                  style={{
                    fontSize: 13,
                    color: "var(--brass)",
                  }}
                >
                  Étape {step.num}
                </p>

                <h3
                  className="mb-4"
                  style={{ color: "var(--bone)", fontSize: 16 }}
                >
                  {step.title}
                </h3>

                <p
                  className="text-body"
                  style={{
                    color: "var(--stone)",
                    fontSize: 15,
                    lineHeight: 1.8,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          OWNER CTA — Split editorial layout
          ════════════════════════════════════════════ */}
      <section id="proprietaires" className="section-alabaster">
        <div
          className="container-saha"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            minHeight: 600,
          }}
        >
          <div
            className="md:grid"
            style={{
              gridTemplateColumns: "1fr 1fr",
              alignItems: "center",
            }}
          >
            {/* Left — Content */}
            <div style={{ padding: "120px 0" }}>
              <p
                className="text-caption fade-up mb-4"
                style={{ color: "var(--brass)" }}
              >
                Espace propriétaires
              </p>

              <h2
                className="fade-up"
                style={{
                  color: "var(--obsidian)",
                  marginBottom: 24,
                }}
              >
                Publiez votre
                <br />
                salle d&apos;exception
              </h2>

              <p
                className="text-body fade-up"
                style={{
                  color: "var(--stone)",
                  maxWidth: 400,
                  marginBottom: 40,
                }}
              >
                Rejoignez la première plateforme dédiée aux salles des fêtes
                en Algérie. Visibilité maximale, gestion simplifiée, paiements
                sécurisés.
              </p>

              {/* Benefits list */}
              <div className="flex flex-col gap-5 mb-10">
                {[
                  "Visibilité auprès de milliers de clients",
                  "Gestion simplifiée des réservations",
                  "Paiements sécurisés via CCP",
                  "Support dédié 7j/7",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3 fade-up">
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: "rgba(46,82,64,0.1)",
                        color: "var(--malachite)",
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      ✓
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-manrope)",
                        fontWeight: 400,
                        color: "var(--stone)",
                        fontSize: 15,
                        lineHeight: 1.6,
                      }}
                    >
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <Link href="/auth" className="btn-primary no-underline fade-up">
                Publier ma salle
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            </div>

            {/* Right — Decorative vertical strip */}
            <div
              className="hidden md:block relative"
              style={{ height: "100%", overflow: "hidden" }}
            >
              <Image
                src="/images/venue-3.png"
                alt="Cour intérieure d'un riad algérien"
                fill
                className="object-cover"
                sizes="50vw"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, var(--alabaster) 0%, transparent 30%)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FINAL CTA — Ceremonial closing
          ════════════════════════════════════════════ */}
      <section
        className="section-obsidian"
        style={{ padding: "160px 0", textAlign: "center" }}
      >
        <div className="container-saha">
          <h2
            className="fade-up"
            style={{
              color: "var(--bone)",
              marginBottom: 24,
            }}
          >
            Votre célébration
            <br />
            <span style={{ color: "var(--brass)" }}>commence ici</span>
          </h2>
          <p
            className="text-body fade-up mx-auto"
            style={{
              color: "var(--stone)",
              maxWidth: 480,
              marginBottom: 48,
            }}
          >
            Trouvez la salle parfaite pour le plus beau jour de votre vie.
            Plus de 500 espaces vérifiés vous attendent.
          </p>
          <Link
            href="/parcourir"
            className="btn-primary no-underline fade-up"
            style={{ fontSize: 14, height: 52, paddingLeft: 36, paddingRight: 36 }}
          >
            Commencer l&apos;exploration
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ── Venue Card Component ── */
function VenueCard({ venue, large }: { venue: FeaturedVenue; large?: boolean }) {
  return (
    <Link
      href={`/salle/${venue.id}`}
      className="group relative block overflow-hidden no-underline"
      style={{
        borderRadius: 6,
        gridRow: large ? "1 / -1" : undefined,
      }}
    >
      {/* Image */}
      <Image
        src={venue.image}
        alt={venue.name}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes={large ? "60vw" : "40vw"}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(to top, rgba(14,12,9,0.85) 0%, rgba(14,12,9,0.3) 40%, transparent 70%)",
        }}
      />

      {/* Content overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 p-6"
        style={{ zIndex: 2 }}
      >
        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star
            size={12}
            fill="var(--candlelight)"
            color="var(--candlelight)"
          />
          <span
            className="text-mono"
            style={{ fontSize: 12, color: "var(--candlelight)" }}
          >
            {venue.rating}
          </span>
        </div>

        <h3
          style={{
            color: "var(--bone)",
            fontSize: large ? 22 : 16,
            fontWeight: 600,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {venue.name}
        </h3>

        <div className="flex items-center gap-4">
          <span
            className="flex items-center gap-1"
            style={{ color: "var(--stone)", fontSize: 13 }}
          >
            <MapPin size={12} strokeWidth={1.5} />
            {venue.wilaya}
          </span>
          <span
            className="flex items-center gap-1"
            style={{ color: "var(--stone)", fontSize: 13 }}
          >
            <Users size={12} strokeWidth={1.5} />
            {venue.capacity}
          </span>
        </div>

        {/* Price */}
        <p
          className="text-mono mt-3"
          style={{ color: "var(--brass)", fontSize: large ? 18 : 15 }}
        >
          {venue.price.toLocaleString("fr-DZ")} DA
          <span style={{ fontSize: 11, color: "var(--stone)", marginLeft: 4 }}>
            / jour
          </span>
        </p>
      </div>
    </Link>
  );
}
