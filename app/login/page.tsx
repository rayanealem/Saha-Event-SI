"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { login } from "./actions";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <section style={{ minHeight: "100vh", backgroundColor: "var(--obsidian)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--brass)" }} />
      </section>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);

    startTransition(async () => {
      try {
        const redirectTo = searchParams.get("redirect_to") || undefined;
        const result = await login(formData, redirectTo);
        if (result?.error) {
          setError(result.error);
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
            Bon retour
          </p>
          <h1
            style={{
              color: "var(--bone)",
              fontSize: "clamp(32px, 5vw, 44px)",
              marginBottom: 12,
            }}
          >
            Connexion
          </h1>
          <p
            className="text-body"
            style={{ color: "var(--stone)", marginBottom: 48, fontSize: 15 }}
          >
            Entrez vos identifiants pour accéder à votre espace.
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-0">
            <div className="mb-1">
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

            <div className="flex justify-end mt-2">
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: 12, color: "var(--stone)" }}
              >
                Mot de passe oublié ?
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
                  Se connecter
                  <ArrowRight size={16} strokeWidth={1.5} />
                </>
              )}
            </button>
          </form>

          <p
            className="text-center mt-10"
            style={{ color: "var(--stone)", fontSize: 14 }}
          >
            Pas encore de compte ?{" "}
            <Link
              href="/signup"
              className="btn-ghost"
              style={{
                color: "var(--brass)",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
