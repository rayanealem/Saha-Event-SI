"use client";

export const dynamic = "force-dynamic";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  MapPin,
  Users,
  Image as ImageIcon,
  CheckCircle,
  Plus,
  Percent,
  Loader2,
} from "lucide-react";
import { createVenue } from "@/app/actions/venues";

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar",
  "Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger",
  "Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma",
  "Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh",
  "Illizi","Bordj Bou Arreridj","Boumerdès","El Tarf","Tindouf","Tissemsilt",
  "El Oued","Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent",
  "Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar","Ouled Djellal","Béni Abbès",
  "In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Meniaa",
];

const AMENITIES = [
  "Climatisation", "Parking", "Traiteur inclus", "Piste de danse",
  "Scène/Estrade", "Décoration incluse", "Sonorisation", "Éclairage LED",
  "Espace extérieur", "Cuisine", "Vestiaire", "WiFi",
  "Salle VIP", "Photobooth", "Espace enfants", "Fontaine de chocolat",
];

export default function AjouterSallePage() {
  const router = useRouter();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("amenities", JSON.stringify(selectedAmenities));

    startTransition(async () => {
      const result = await createVenue(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    });
  };

  if (submitted) {
    return (
      <section className="section-obsidian" style={{ paddingTop: 68, minHeight: "100vh" }}>
        <div className="container-saha flex flex-col items-center justify-center" style={{ paddingTop: 120, paddingBottom: 120 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "rgba(46,82,64,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <CheckCircle size={28} strokeWidth={1.5} style={{ color: "var(--malachite)" }} />
          </div>
          <h2 style={{ color: "var(--bone)", textAlign: "center", marginBottom: 8 }}>
            Salle soumise avec succès
          </h2>
          <p className="text-body" style={{ color: "var(--stone)", textAlign: "center", maxWidth: 380 }}>
            Votre salle a été publiée et est maintenant visible sur la plateforme.
          </p>
          <Link href="/espace-proprietaire" className="btn-primary no-underline mt-8">
            Retour à mon espace
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-obsidian" style={{ paddingTop: 68, minHeight: "100vh" }}>
      <div className="container-saha" style={{ paddingTop: 60, paddingBottom: 120, maxWidth: 680 }}>
        {/* Back */}
        <Link
          href="/espace-proprietaire"
          className="no-underline flex items-center gap-2 mb-10"
          style={{ color: "var(--stone)", fontSize: 13 }}
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Retour
        </Link>

        <p className="text-caption mb-3" style={{ color: "var(--brass)" }}>
          Nouvelle salle
        </p>
        <h1 style={{ color: "var(--bone)", fontSize: "clamp(26px, 3.5vw, 36px)", marginBottom: 40 }}>
          Ajouter une salle des fêtes
        </h1>

        {/* Error */}
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
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Name */}
          <div>
            <label className="text-label mb-2 block" style={{ color: "var(--stone)" }}>
              Nom de la salle *
            </label>
            <input type="text" name="name" required placeholder="ex: Dar El Nour" className="input-saha" style={{ color: "var(--bone)" }} />
          </div>

          {/* Location row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-label mb-2 block" style={{ color: "var(--stone)" }}>
                <MapPin size={12} strokeWidth={1.5} className="inline mr-1" />
                Wilaya *
              </label>
              <select name="wilaya" required className="input-saha" style={{ color: "var(--bone)" }}>
                <option value="">Sélectionner</option>
                {WILAYAS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-label mb-2 block" style={{ color: "var(--stone)" }}>
                Adresse complète *
              </label>
              <input type="text" name="address" required placeholder="Rue, quartier, ville" className="input-saha" style={{ color: "var(--bone)" }} />
            </div>
          </div>

          {/* Capacity + Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-label mb-2 block" style={{ color: "var(--stone)" }}>
                <Users size={12} strokeWidth={1.5} className="inline mr-1" />
                Capacité maximale *
              </label>
              <input type="number" name="capacity_max" required min={10} placeholder="500" className="input-saha" style={{ color: "var(--bone)" }} />
            </div>
            <div>
              <label className="text-label mb-2 block" style={{ color: "var(--stone)" }}>
                Prix par jour (DA) *
              </label>
              <input type="number" name="price_per_day" required min={1000} placeholder="180000" className="input-saha" style={{ color: "var(--bone)" }} />
            </div>
          </div>

          {/* Deposit percentage */}
          <div>
            <label className="text-label mb-2 block" style={{ color: "var(--stone)" }}>
              <Percent size={12} strokeWidth={1.5} className="inline mr-1" />
              Pourcentage d&apos;acompte (%) *
            </label>
            <input
              type="number"
              name="deposit_percentage"
              required
              min={5}
              max={100}
              defaultValue={25}
              placeholder="25"
              className="input-saha"
              style={{ color: "var(--bone)", maxWidth: 200 }}
            />
            <p style={{ color: "var(--stone)", fontSize: 11, marginTop: 4, opacity: 0.6 }}>
              Le client devra verser ce pourcentage du total comme acompte pour confirmer la réservation.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-label mb-2 block" style={{ color: "var(--stone)" }}>
              Description *
            </label>
            <textarea
              name="description"
              required
              rows={5}
              placeholder="Décrivez votre salle, son ambiance, ses atouts..."
              className="input-saha"
              style={{ color: "var(--bone)", resize: "vertical" }}
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="text-label mb-3 block" style={{ color: "var(--stone)" }}>
              Équipements
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const active = selectedAmenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      letterSpacing: "0.03em",
                      cursor: "pointer",
                      border: active ? "1px solid var(--brass)" : "1px solid rgba(168,124,62,0.15)",
                      background: active ? "rgba(168,124,62,0.12)" : "transparent",
                      color: active ? "var(--brass)" : "var(--stone)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {active && <CheckCircle size={11} strokeWidth={2} className="inline mr-1" />}
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="text-label mb-3 block" style={{ color: "var(--stone)" }}>
              <ImageIcon size={12} strokeWidth={1.5} className="inline mr-1" />
              Photos (optionnel)
            </label>
            <div
              style={{
                padding: "40px 20px",
                borderRadius: 6,
                border: "2px dashed rgba(168,124,62,0.2)",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(168,124,62,0.4)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(168,124,62,0.2)")}
            >
              <Upload size={24} strokeWidth={1.5} style={{ color: "var(--stone)", margin: "0 auto 12px" }} />
              <p className="text-caption" style={{ color: "var(--stone)", margin: 0 }}>
                Glissez vos photos ici ou <span style={{ color: "var(--brass)", textDecoration: "underline" }}>parcourir</span>
              </p>
              <p style={{ color: "var(--stone)", fontSize: 11, marginTop: 4, opacity: 0.6 }}>
                JPEG, PNG · Max 5 Mo chacune
              </p>
            </div>
          </div>

          {/* Divider */}
          <hr style={{ border: "none", borderTop: "1px solid rgba(168,124,62,0.1)", margin: "8px 0" }} />

          {/* Submit */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-caption" style={{ color: "var(--stone)", margin: 0, maxWidth: 300 }}>
              Votre salle sera publiée directement sur la plateforme.
            </p>
            <button
              type="submit"
              className="btn-primary"
              style={{ minWidth: 180, opacity: isPending ? 0.7 : 1 }}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Plus size={14} strokeWidth={2} />
                  Publier la salle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
