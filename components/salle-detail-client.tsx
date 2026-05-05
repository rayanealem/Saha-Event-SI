"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { differenceInDays, format } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { DateRange } from "react-day-picker";
import {
  MapPin,
  Users,
  Star,
  Maximize,
  Calendar,
  Phone,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ── Types ── */
interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
}

interface VenueDetail {
  id: string;
  name: string;
  wilaya: string;
  address: string;
  price_per_day: number;
  deposit_percentage: number;
  capacity_max: number;
  area_m2: number;
  rating: number;
  totalReviews: number;
  description: string;
  options: string[];
  images: string[];
  reviews: Review[];
}

import { BookingCalendar } from "./venue/booking-calendar";

export function SalleDetailClient({ venue, bookings = [] }: { venue: VenueDetail, bookings?: any[] }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Check auth state
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    el.querySelectorAll(".fade-up").forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  const nextImage = () =>
    setCurrentImage((prev) => (prev + 1) % venue.images.length);
  const prevImage = () =>
    setCurrentImage(
      (prev) => (prev - 1 + venue.images.length) % venue.images.length
    );

  return (
    <div ref={sectionRef}>
      {/* ── Gallery hero ── */}
      <section className="relative" style={{ height: "70vh", minHeight: 500 }}>
        <Image
          src={venue.images[currentImage]}
          alt={`${venue.name} — photo ${currentImage + 1}`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--obsidian) 0%, transparent 50%)",
          }}
        />

        {/* Gallery nav */}
        <div
          className="absolute bottom-8 right-8 flex items-center gap-3"
          style={{ zIndex: 10 }}
        >
          <button
            onClick={prevImage}
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(14,12,9,0.6)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(168,124,62,0.2)",
              borderRadius: 24,
              color: "var(--bone)",
              cursor: "pointer",
            }}
            aria-label="Photo précédente"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <span
            className="text-mono"
            style={{ fontSize: 12, color: "var(--bone)" }}
          >
            {String(currentImage + 1).padStart(2, "0")} /{" "}
            {String(venue.images.length).padStart(2, "0")}
          </span>
          <button
            onClick={nextImage}
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(14,12,9,0.6)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(168,124,62,0.2)",
              borderRadius: 24,
              color: "var(--bone)",
              cursor: "pointer",
            }}
            aria-label="Photo suivante"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Back button */}
        <Link
          href="/parcourir"
          className="absolute top-24 left-8 flex items-center gap-2 no-underline"
          style={{
            color: "var(--bone)",
            fontSize: 13,
            fontFamily: "var(--font-manrope)",
            fontWeight: 500,
            zIndex: 10,
            background: "rgba(14,12,9,0.4)",
            backdropFilter: "blur(8px)",
            padding: "8px 16px",
            borderRadius: 24,
          }}
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Retour
        </Link>
      </section>

      {/* ── Content ── */}
      <section className="section-obsidian">
        <div className="container-saha" style={{ paddingTop: 60, paddingBottom: 120 }}>
          <div
            className="md:grid items-start"
            style={{ gridTemplateColumns: "1fr 380px", gap: 64 }}
          >
            {/* Left column — Details */}
            <div>
              {/* Title block */}
              <div className="fade-up mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1">
                    <Star size={14} fill="var(--candlelight)" color="var(--candlelight)" />
                    <span className="text-mono" style={{ fontSize: 14, color: "var(--candlelight)" }}>
                      {venue.rating}
                    </span>
                  </div>
                  <span style={{ color: "var(--stone)", fontSize: 13 }}>
                    ({venue.totalReviews} avis)
                  </span>
                </div>

                <h1 style={{ color: "var(--bone)", marginBottom: 12 }}>
                  {venue.name}
                </h1>

                <div className="flex items-center gap-2" style={{ color: "var(--stone)", fontSize: 14 }}>
                  <MapPin size={14} strokeWidth={1.5} />
                  {venue.address}
                </div>
              </div>

              {/* Key stats */}
              <div
                className="fade-up grid grid-cols-3 gap-6 mb-16"
                style={{
                  padding: "28px 0",
                  borderTop: "1px solid rgba(168,124,62,0.15)",
                  borderBottom: "1px solid rgba(168,124,62,0.15)",
                }}
              >
                {[
                  {
                    icon: <Users size={18} strokeWidth={1.5} />,
                    value: `${venue.capacity_max}`,
                    label: "Invités max",
                  },
                  {
                    icon: <Maximize size={18} strokeWidth={1.5} />,
                    value: `${venue.area_m2} m²`,
                    label: "Surface",
                  },
                  {
                    icon: <Calendar size={18} strokeWidth={1.5} />,
                    value: `${venue.deposit_percentage}%`,
                    label: "Acompte",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div
                      className="flex justify-center mb-2"
                      style={{ color: "var(--brass)" }}
                    >
                      {stat.icon}
                    </div>
                    <p
                      className="text-mono"
                      style={{ fontSize: 20, color: "var(--bone)", marginBottom: 2 }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-caption" style={{ color: "var(--stone)" }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="fade-up mb-16">
                <h3 className="mb-5" style={{ color: "var(--bone)" }}>
                  À propos
                </h3>
                <p
                  className="text-body"
                  style={{
                    color: "var(--stone)",
                    lineHeight: 2,
                    fontSize: 15,
                  }}
                >
                  {venue.description}
                </p>
              </div>

              {/* Amenities */}
              {venue.options.length > 0 && (
                <div className="fade-up mb-16">
                  <h3 className="mb-5" style={{ color: "var(--bone)" }}>
                    Équipements &amp; Services
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {venue.options.map((opt) => (
                      <div
                        key={opt}
                        className="flex items-center gap-3"
                        style={{ padding: "8px 0" }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 20,
                            height: 20,
                            borderRadius: 24,
                            backgroundColor: "rgba(168,124,62,0.1)",
                            color: "var(--brass)",
                            flexShrink: 0,
                          }}
                        >
                          <Check size={12} strokeWidth={2} />
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-manrope)",
                            fontWeight: 300,
                            fontSize: 14,
                            color: "var(--bone)",
                            opacity: 0.8,
                          }}
                        >
                          {opt}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="fade-up">
                <h3 className="mb-5" style={{ color: "var(--bone)" }}>
                  Avis récents
                </h3>
                <div className="flex flex-col gap-6">
                  {venue.reviews.map((review) => (
                    <div
                      key={review.id}
                      style={{
                        padding: "24px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(168,124,62,0.1)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar placeholder */}
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "rgba(168,124,62,0.15)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--brass)",
                              fontFamily: "var(--font-manrope)",
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            {review.name[0]}
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: "var(--bone)",
                                margin: 0,
                              }}
                            >
                              {review.name}
                            </p>
                            <p
                              className="text-mono"
                              style={{ fontSize: 11, color: "var(--stone)", margin: 0 }}
                            >
                              {review.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={
                                i < review.rating
                                  ? "var(--candlelight)"
                                  : "transparent"
                              }
                              color="var(--candlelight)"
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                      </div>
                      <p
                        className="text-body"
                        style={{ color: "var(--stone)", fontSize: 14, margin: 0 }}
                      >
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column — Booking card (sticky) */}
            <div className="hidden md:block">
              <div
                className="fade-up"
                style={{
                  position: "sticky",
                  top: 100,
                  padding: 32,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(168,124,62,0.15)",
                }}
              >
                {/* Price */}
                <p
                  className="text-mono"
                  style={{ fontSize: 32, color: "var(--candlelight)", marginBottom: 4 }}
                >
                  {venue.price_per_day.toLocaleString("fr-DZ")} DA
                </p>
                <p className="text-caption mb-8" style={{ color: "var(--stone)" }}>
                  Par jour · Acompte {venue.deposit_percentage}%
                </p>

                <hr className="divider-brass mb-8" />

                {/* Date inputs replaced by BookingCalendar */}
                <div className="mb-8" style={{ background: "var(--obsidian)", padding: "12px", borderRadius: "12px" }}>
                  <BookingCalendar
                    reservations={bookings}
                    selectedRange={dateRange}
                    onSelectRange={setDateRange}
                    className="bg-transparent border-none p-0 shadow-none text-bone"
                  />
                </div>

                {/* Price breakdown */}
                {dateRange?.from && dateRange?.to ? (
                  <div className="flex flex-col gap-3 mb-8">
                    <div className="flex justify-between">
                      <span style={{ color: "var(--stone)", fontSize: 14 }}>
                        {differenceInDays(dateRange.to, dateRange.from) + 1} jour(s) × {venue.price_per_day.toLocaleString("fr-DZ")} DA
                      </span>
                      <span className="text-mono" style={{ fontSize: 14, color: "var(--bone)" }}>
                        {((differenceInDays(dateRange.to, dateRange.from) + 1) * venue.price_per_day).toLocaleString("fr-DZ")} DA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--stone)", fontSize: 14 }}>
                        Acompte ({venue.deposit_percentage}%)
                      </span>
                      <span className="text-mono" style={{ fontSize: 14, color: "var(--brass)" }}>
                        {(((differenceInDays(dateRange.to, dateRange.from) + 1) * venue.price_per_day) * venue.deposit_percentage / 100).toLocaleString("fr-DZ")} DA
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 mb-8">
                    <p className="text-sm text-stone m-0">Veuillez sélectionner vos dates pour voir le détail du prix.</p>
                  </div>
                )}

                <hr className="divider-brass mb-8" />

                {!isAuthenticated ? (
                  <Link
                    href="/auth"
                    className="btn-primary w-full no-underline"
                    style={{ textAlign: "center" }}
                  >
                    Connexion requise pour réserver
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </Link>
                ) : (
                  <Link
                    href={dateRange?.from && dateRange?.to ? `/reservation/${venue.id}?start=${format(dateRange.from, 'yyyy-MM-dd')}&end=${format(dateRange.to, 'yyyy-MM-dd')}` : '#'}
                    className={`btn-primary w-full no-underline ${!dateRange?.from || !dateRange?.to ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                  >
                    Réserver cette salle
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </Link>
                )}

                {/* Contact */}
                <button
                  className="btn-secondary w-full mt-3"
                  style={{ fontSize: 12 }}
                >
                  <Phone size={14} strokeWidth={1.5} />
                  Contacter le propriétaire
                </button>
              </div>
            </div>
          </div>

          {/* Spacer for mobile bar */}
          <div className="md:hidden" style={{ height: 80 }} />

          {/* Mobile booking bar */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-between"
            style={{
              padding: "16px 20px",
              backgroundColor: "var(--obsidian)",
              borderTop: "1px solid rgba(168,124,62,0.15)",
              zIndex: "var(--z-sticky)" as unknown as number,
            }}
          >
            <div>
              <p className="text-mono" style={{ fontSize: 20, color: "var(--candlelight)", margin: 0 }}>
                {venue.price_per_day.toLocaleString("fr-DZ")} DA
              </p>
              <p className="text-caption" style={{ color: "var(--stone)", margin: 0 }}>
                par jour
              </p>
            </div>
            {isAuthenticated ? (
              <Link
                href={`/reservation/${venue.id}`}
                className="btn-primary no-underline"
                style={{ height: 44 }}
              >
                Réserver
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            ) : (
              <Link
                href="/auth"
                className="btn-primary no-underline"
                style={{ height: 44 }}
              >
                Connexion
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
