import Link from "next/link";
import { Instagram, Facebook, MessageCircle } from "lucide-react";

const PLATFORM_LINKS = [
  { label: "Parcourir les salles", href: "/parcourir" },
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "Tarification", href: "/#tarification" },
] as const;

const OWNER_LINKS = [
  { label: "Publier votre salle", href: "/auth" },
  { label: "Tableau de bord", href: "/espace-proprietaire" },
  { label: "Documentation", href: "#" },
] as const;

const SUPPORT_LINKS = [
  { label: "Centre d'aide", href: "#" },
  { label: "Contactez-nous", href: "#" },
  { label: "FAQ", href: "#" },
] as const;

const LEGAL_LINKS = [
  { label: "Conditions d'utilisation", href: "#" },
  { label: "Politique de confidentialité", href: "#" },
  { label: "Mentions légales", href: "#" },
] as const;

interface FooterColumnProps {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h3
        className="mb-6"
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--bone)",
        }}
      >
        {title}
      </h3>
      <ul className="list-none p-0 m-0 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="footer-link no-underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--obsidian)" }}>
      <div className="container-saha section-pad">
        {/* Top: Logo + tagline */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-16">
          <div>
            <Link
              href="/"
              className="flex items-baseline gap-0.5 no-underline mb-2"
              aria-label="Saha·Event"
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
            <p
              style={{
                color: "var(--stone)",
                fontWeight: 300,
                fontSize: 14,
                margin: 0,
              }}
            >
              La plateforme de réservation de salles des fêtes en Algérie.
            </p>
          </div>
        </div>

        {/* 4-column links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <FooterColumn title="Plateforme" links={PLATFORM_LINKS} />
          <FooterColumn title="Propriétaires" links={OWNER_LINKS} />
          <FooterColumn title="Support" links={SUPPORT_LINKS} />
          <FooterColumn title="Légal" links={LEGAL_LINKS} />
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid rgba(168, 124, 62, 0.1)" }}
        >
          <p
            className="text-mono"
            style={{ color: "var(--stone)", fontSize: 11, margin: 0 }}
          >
            © {new Date().getFullYear()} Saha·Event. Tous droits réservés.
          </p>

          <div className="flex items-center gap-5">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="footer-social-link"
            >
              <Instagram size={18} strokeWidth={1.5} />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="footer-social-link"
            >
              <Facebook size={18} strokeWidth={1.5} />
            </a>
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="footer-social-link"
            >
              <MessageCircle size={18} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
