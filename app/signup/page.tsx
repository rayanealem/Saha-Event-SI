"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition, Suspense } from "react";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { signup } from "./actions";

type UserRole = "CLIENT" | "OWNER";

export default function SignupPage() {
  return (
    <Suspense fallback={
      <section style={{ minHeight: "100vh", backgroundColor: "var(--obsidian)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--brass)" }} />
      </section>
    }>
      <SignupPageContent />
    </Suspense>
  );
}

function SignupPageContent() {
  const [role, setRole] = useState<UserRole>("CLIENT");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    formData.set("full_name", fullName);
    formData.set("phone", phone);
    formData.set("role", role);

    startTransition(async () => {
      try {
        const result = await signup(formData);
        if (result?.error) {
          setError(result.error);
        } else if (result?.success) {
          setSuccess(result.message || "Compte créé avec succès !");
          // Clear form
          setEmail("");
          setPassword("");
          setFullName("");
          setPhone("");
        }
      } catch {
        // redirect() throws NEXT_REDIRECT — this is expected behavior
      }
    });
  };

  return (
    <section
      className="relative"
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--obsidian)",
        display: "flex",
      }}
    >
      {/* Left — Image panel (hidden on mobile) */}
      <div
        className="hidden lg:block relative"
        style={{ width: "45%", minHeight: "100vh" }}
      >
        <Image
          src="/images/venue-2.png"
          alt="Intérieur d'une salle des fêtes"
          fill
          className="object-cover"
          sizes="45vw"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, transparent 60%, var(--obsidian) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--obsidian) 0%, transparent 40%)",
          }}
        />
        {/* Overlay logo */}
        <div className="absolute bottom-16 left-12">
          <Link
            href="/"
            className="flex items-baseline gap-0.5 no-underline"
          >
            <span
              className="font-display italic"
              style={{ fontSize: 28, color: "var(--brass)" }}
            >
              Saha
            </span>
            <span
              className="font-sans"
              style={{ fontSize: 28, fontWeight: 300, color: "var(--bone)" }}
            >
              Event
            </span>
          </Link>
          <p
            className="text-body mt-3"
            style={{
              color: "var(--stone)",
              maxWidth: 280,
              fontSize: 14,
            }}
          >
            La plateforme de réservation de salles des fêtes en Algérie.
          </p>
        </div>
      </div>

      {/* Right — Form panel */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ paddingTop: 100, paddingBottom: 60 }}
      >
        <div style={{ width: "100%", maxWidth: 420, padding: "0 32px" }}>
          {/* Mobile logo */}
          <div className="lg:hidden mb-12">
            <Link
              href="/"
              className="flex items-baseline gap-0.5 no-underline"
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
          </div>

          {/* Header */}
          <p className="text-caption mb-4" style={{ color: "var(--brass)" }}>
            Rejoignez-nous
          </p>
          <h1
            style={{
              color: "var(--bone)",
              fontSize: "clamp(32px, 5vw, 44px)",
              marginBottom: 12,
            }}
          >
            Inscription
          </h1>
          <p
            className="text-body"
            style={{ color: "var(--stone)", marginBottom: 48, fontSize: 15 }}
          >
            Créez votre compte et commencez à explorer.
          </p>

          {/* Error message */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                marginBottom: 24,
                borderRadius: 12,
                background: "rgba(139, 46, 32, 0.15)",
                border: "1px solid rgba(139, 46, 32, 0.3)",
                color: "#e8a090",
                fontSize: 14,
                fontFamily: "var(--font-manrope)",
                fontWeight: 400,
              }}
            >
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div
              style={{
                padding: "16px 20px",
                marginBottom: 24,
                borderRadius: 12,
                background: "rgba(46, 82, 64, 0.2)",
                border: "1px solid rgba(46, 82, 64, 0.4)",
                color: "#a8d8b8",
                fontSize: 14,
                fontFamily: "var(--font-manrope)",
                fontWeight: 400,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <CheckCircle2 size={20} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontWeight: 500, marginBottom: 4 }}>Inscription réussie !</p>
                <p style={{ opacity: 0.85, lineHeight: 1.5 }}>{success}</p>
                <Link
                  href="/login"
                  style={{
                    display: "inline-block",
                    marginTop: 12,
                    padding: "8px 20px",
                    borderRadius: 20,
                    background: "rgba(46, 82, 64, 0.3)",
                    border: "1px solid rgba(46, 82, 64, 0.5)",
                    color: "#a8d8b8",
                    fontSize: 13,
                    cursor: "pointer",
                    textDecoration: "none",
                    fontFamily: "var(--font-manrope)",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                  }}
                >
                  Se connecter →
                </Link>
              </div>
            </div>
          )}

          {/* Role toggle */}
          {!success && (
            <div
              className="flex mb-8"
              style={{
                borderRadius: 24,
                overflow: "hidden",
                border: "1px solid rgba(168,124,62,0.2)",
              }}
            >
              {(["CLIENT", "OWNER"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="text-caption"
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    background:
                      role === r
                        ? "var(--brass)"
                        : "transparent",
                    color:
                      role === r
                        ? "var(--bone)"
                        : "var(--stone)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    fontSize: 11,
                  }}
                >
                  {r === "CLIENT" ? "Je cherche une salle" : "Je suis propriétaire"}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-0">
              <div className="mb-1">
                <label className="text-label" style={{ color: "var(--stone)", display: "block", marginBottom: 4 }}>
                  Nom complet
                </label>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Votre nom complet"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-dark"
                  required
                />
              </div>

              <div className="mb-1" style={{ marginTop: 20 }}>
                <label className="text-label" style={{ color: "var(--stone)", display: "block", marginBottom: 4 }}>
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark"
                  required
                />
              </div>

              <div className="mb-1" style={{ marginTop: 20 }}>
                <label className="text-label" style={{ color: "var(--stone)", display: "block", marginBottom: 4 }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="0555 XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-dark"
                />
              </div>

              <div className="mb-1 relative" style={{ marginTop: 20 }}>
                <label className="text-label" style={{ color: "var(--stone)", display: "block", marginBottom: 4 }}>
                  Mot de passe
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark"
                  style={{ paddingRight: 40 }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0"
                  style={{
                    bottom: 12,
                    background: "transparent",
                    border: "none",
                    color: "var(--stone)",
                    cursor: "pointer",
                    padding: 4,
                  }}
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.5} />
                  ) : (
                    <Eye size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                style={{
                  marginTop: 36,
                  opacity: isPending ? 0.7 : 1,
                  pointerEvents: isPending ? "none" : "auto",
                }}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    Créer mon compte
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle mode */}
          {!success && (
            <p
              className="text-center mt-10"
              style={{ color: "var(--stone)", fontSize: 14 }}
            >
              Déjà inscrit ?{" "}
              <Link
                href="/login"
                className="btn-ghost"
                style={{
                  color: "var(--brass)",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Se connecter
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
