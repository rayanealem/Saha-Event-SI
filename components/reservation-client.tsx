'use client'

import { useState } from "react"
import { Calendar, MapPin, UploadCloud, ArrowRight, ShieldCheck, CheckCircle2, Building, Receipt, FileText, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createBooking } from "@/app/actions/bookings"
import { uploadCCPReceipt } from "@/app/actions/documents"
import { useRouter } from "next/navigation"

import { BookingCalendar } from "./venue/booking-calendar"

export function ReservationClient({ venue, bookings }: { venue: any, bookings: any[] }) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const router = useRouter()

  const depositAmount = (venue.price_per_day * (venue.deposit_percentage || 30)) / 100
  
  const handleBookingCreate = async () => {
    if (!selectedDate) {
      setError("Veuillez sélectionner une date pour votre événement.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    const res = await createBooking({
      venue_id: venue.id,
      start_date: selectedDate,
      end_date: selectedDate,
      total_price: venue.price_per_day,
      deposit_amount: depositAmount
    })

    if (res.error) {
      setError(res.error)
      setIsSubmitting(false)
      return
    }

    if (res.data) {
      setReservationId(res.data.id)
      setStep(2)
    }
    setIsSubmitting(false)
  }

  const handleFileUpload = async () => {
    if (!file || !reservationId) return
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    
    const res = await uploadCCPReceipt(reservationId, formData)
    if (res.error) {
      setError(res.error)
      setIsSubmitting(false)
      return
    }

    setStep(3)
    setIsSubmitting(false)
  }

  const formattedDate = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—"

  return (
    <div className="container-saha" style={{ maxWidth: 1100, margin: "0 auto" }}>
      
      {/* Progress Header */}
      <div style={{ marginBottom: 48 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
          <span className="text-caption" style={{ color: "var(--stone)" }}>
            Étape {step} sur 3
          </span>
          <span className="text-caption" style={{ color: "var(--brass)" }}>
            {step === 1 && "Récapitulatif"}
            {step === 2 && "Paiement CCP"}
            {step === 3 && "Confirmation"}
          </span>
        </div>
        <div style={{ width: "100%", height: 1, backgroundColor: "rgba(168,124,62,0.15)", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              backgroundColor: "var(--brass)",
              transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
              width: `${(step / 3) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: "14px 20px",
            marginBottom: 32,
            borderRadius: 12,
            background: "rgba(139, 46, 32, 0.12)",
            border: "1px solid rgba(139, 46, 32, 0.25)",
            color: "#e8a090",
            fontSize: 14,
            fontFamily: "var(--font-manrope)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle size={16} strokeWidth={1.5} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* STEP 1: SUMMARY */}
      {step === 1 && (
        <div className="md:grid" style={{ gridTemplateColumns: "1fr 380px", gap: 48 }}>
          
          <div>
            <p className="text-caption" style={{ color: "var(--brass)", marginBottom: 12 }}>
              Réservation
            </p>
            <h1 style={{ color: "var(--bone)", marginBottom: 12, fontSize: "clamp(32px, 5vw, 48px)" }}>
              {venue.name}
            </h1>
            <p className="flex items-center gap-2" style={{ color: "var(--stone)", fontSize: 14, marginBottom: 48 }}>
              <MapPin size={14} strokeWidth={1.5} />
              {venue.wilaya}{venue.address ? ` — ${venue.address}` : ""}
            </p>

            {/* Date Selection */}
            <div style={{ marginBottom: 48 }}>
              <h3 style={{ color: "var(--bone)", marginBottom: 16, fontSize: 18 }}>
                <Calendar size={16} strokeWidth={1.5} style={{ display: "inline", marginRight: 8, color: "var(--brass)" }} />
                Date de l'événement
              </h3>
              <BookingCalendar 
                reservations={bookings}
                mode="single"
                selectedDate={selectedDate ? new Date(selectedDate) : undefined}
                onSelectDate={(date) => {
                  if (date) {
                    // Convert date to YYYY-MM-DD local time to avoid timezone offset issues
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                    const dd = String(date.getDate()).padStart(2, '0');
                    setSelectedDate(`${yyyy}-${mm}-${dd}`);
                  } else {
                    setSelectedDate("");
                  }
                }}
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(168,124,62,0.2)] rounded-xl p-4 shadow-sm"
              />
            </div>

            {/* Price Info */}
            <div
              style={{
                padding: "24px 0",
                borderTop: "1px solid rgba(168,124,62,0.12)",
                borderBottom: "1px solid rgba(168,124,62,0.12)",
              }}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                <span style={{ color: "var(--stone)", fontSize: 14 }}>Prix de la location</span>
                <span className="text-mono" style={{ fontSize: 16, color: "var(--bone)" }}>
                  {venue.price_per_day?.toLocaleString("fr-DZ")} DA
                </span>
              </div>
              <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                <span style={{ color: "var(--stone)", fontSize: 14 }}>Frais de service</span>
                <span className="text-mono" style={{ fontSize: 13, color: "var(--brass)" }}>Gratuit</span>
              </div>
              <div className="flex justify-between items-center" style={{ paddingTop: 12, borderTop: "1px solid rgba(168,124,62,0.08)" }}>
                <span style={{ color: "var(--bone)", fontSize: 14, fontWeight: 500 }}>Acompte ({venue.deposit_percentage || 30}%)</span>
                <span className="text-mono" style={{ fontSize: 20, color: "var(--candlelight)" }}>
                  {depositAmount?.toLocaleString("fr-DZ")} DA
                </span>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar — Summary Card */}
          <div className="hidden md:block">
            <div
              style={{
                position: "sticky",
                top: 100,
                padding: 32,
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(168,124,62,0.15)",
              }}
            >
              <h2
                className="font-display italic"
                style={{ fontSize: 24, color: "var(--brass)", marginBottom: 24 }}
              >
                Résumé
              </h2>

              <div style={{ marginBottom: 24 }}>
                <div className="flex justify-between" style={{ marginBottom: 8 }}>
                  <span style={{ color: "var(--stone)", fontSize: 13 }}>Salle</span>
                  <span style={{ color: "var(--bone)", fontSize: 13, fontWeight: 500 }}>{venue.name}</span>
                </div>
                <div className="flex justify-between" style={{ marginBottom: 8 }}>
                  <span style={{ color: "var(--stone)", fontSize: 13 }}>Date</span>
                  <span className="text-mono" style={{ color: "var(--bone)", fontSize: 12 }}>
                    {selectedDate || "À sélectionner"}
                  </span>
                </div>
                <div className="flex justify-between" style={{ marginBottom: 8 }}>
                  <span style={{ color: "var(--stone)", fontSize: 13 }}>Total</span>
                  <span className="text-mono" style={{ color: "var(--bone)", fontSize: 13 }}>
                    {venue.price_per_day?.toLocaleString("fr-DZ")} DA
                  </span>
                </div>
              </div>

              <hr className="divider-brass" style={{ marginBottom: 24 }} />

              <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
                <span style={{ color: "var(--bone)", fontSize: 14, fontWeight: 500 }}>Acompte à verser</span>
                <span className="text-mono" style={{ fontSize: 22, color: "var(--candlelight)" }}>
                  {depositAmount?.toLocaleString("fr-DZ")} DA
                </span>
              </div>

              <button
                onClick={handleBookingCreate}
                disabled={isSubmitting || !selectedDate}
                className="btn-primary w-full"
                style={{
                  opacity: isSubmitting || !selectedDate ? 0.5 : 1,
                  pointerEvents: isSubmitting ? "none" : "auto",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    En cours...
                  </>
                ) : (
                  <>
                    Valider & Payer l'acompte
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </>
                )}
              </button>

              <p style={{ color: "var(--stone)", fontSize: 11, marginTop: 12, textAlign: "center", lineHeight: 1.6, opacity: 0.7 }}>
                Ce montant est nécessaire pour bloquer vos dates. Le reste sera payé directement au propriétaire.
              </p>
            </div>
          </div>

          {/* Mobile CTA */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-between"
            style={{
              padding: "16px 20px",
              backgroundColor: "var(--obsidian)",
              borderTop: "1px solid rgba(168,124,62,0.15)",
              zIndex: 50,
            }}
          >
            <div>
              <p className="text-mono" style={{ fontSize: 18, color: "var(--candlelight)", margin: 0 }}>
                {depositAmount?.toLocaleString("fr-DZ")} DA
              </p>
              <p className="text-caption" style={{ color: "var(--stone)", margin: 0 }}>acompte</p>
            </div>
            <button
              onClick={handleBookingCreate}
              disabled={isSubmitting || !selectedDate}
              className="btn-primary"
              style={{ height: 44 }}
            >
              {isSubmitting ? "En cours..." : "Valider"}
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PAYMENT INFO & UPLOAD */}
      {step === 2 && (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <p className="text-caption" style={{ color: "var(--brass)", marginBottom: 12 }}>
            Paiement
          </p>
          <h1 style={{ color: "var(--bone)", marginBottom: 12, fontSize: "clamp(28px, 4vw, 40px)" }}>
            Versement CCP
          </h1>
          <p style={{ color: "var(--stone)", fontSize: 15, marginBottom: 48, display: "flex", alignItems: "center", gap: 8 }}>
            <Receipt size={16} strokeWidth={1.5} style={{ color: "var(--brass)" }} />
            Veuillez verser l'acompte de <span className="text-mono" style={{ color: "var(--candlelight)", marginLeft: 4 }}>{depositAmount?.toLocaleString("fr-DZ")} DA</span>
          </p>

          {/* CCP Card */}
          <div
            style={{
              padding: "32px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(168,124,62,0.15)",
              marginBottom: 40,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -10,
                left: 24,
                background: "var(--obsidian)",
                padding: "4px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ShieldCheck size={12} strokeWidth={2} style={{ color: "var(--brass)" }} />
              <span className="text-caption" style={{ color: "var(--brass)", fontSize: 10 }}>Compte vérifié</span>
            </div>

            <div className="md:grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 12 }}>
              <div>
                <p className="text-caption" style={{ color: "var(--stone)", marginBottom: 4 }}>Titulaire</p>
                <p style={{ color: "var(--bone)", fontSize: 18, fontWeight: 500 }}>{venue.ccp_name || "—"}</p>
              </div>
              <div>
                <p className="text-caption" style={{ color: "var(--stone)", marginBottom: 4 }}>Institution</p>
                <p style={{ color: "var(--bone)", fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                  <Building size={14} strokeWidth={1.5} style={{ color: "var(--brass)" }} />
                  Algérie Poste
                </p>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid rgba(168,124,62,0.12)", margin: "20px 0" }} />

            <div>
              <p className="text-caption" style={{ color: "var(--stone)", marginBottom: 8 }}>Numéro de compte (RIP)</p>
              <p className="text-mono" style={{ fontSize: 24, color: "var(--bone)", letterSpacing: "0.1em" }}>
                {venue.ccp_number || "XXXXXXXXXX"}{" "}
                <span style={{ color: "rgba(168,124,62,0.3)", margin: "0 8px" }}>|</span>{" "}
                <span style={{ color: "var(--brass)" }}>{venue.ccp_key || "XX"}</span>
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ color: "var(--bone)", marginBottom: 16, fontSize: 18 }}>
              Télécharger le reçu (Talon)
            </h3>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 32px",
                borderRadius: 12,
                border: "1px dashed rgba(168,124,62,0.25)",
                background: "rgba(255,255,255,0.02)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s ease",
              }}
            >
              <input type="file" style={{ display: "none" }} accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <UploadCloud size={28} strokeWidth={1.5} style={{ color: file ? "var(--brass)" : "var(--stone)", marginBottom: 16 }} />
              <p style={{ color: "var(--bone)", fontSize: 14, marginBottom: 8, fontWeight: 500 }}>
                {file ? file.name : "Glissez-déposez le scan du reçu"}
              </p>
              <span
                className="text-caption"
                style={{
                  color: "var(--brass)",
                  fontSize: 12,
                  border: "1px solid rgba(168,124,62,0.2)",
                  padding: "6px 16px",
                  borderRadius: 20,
                }}
              >
                Sélectionner un fichier
              </span>
            </label>
          </div>

          <button
            onClick={handleFileUpload}
            disabled={!file || isSubmitting}
            className="btn-primary w-full"
            style={{
              height: 52,
              opacity: !file || isSubmitting ? 0.5 : 1,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                Confirmer le paiement
                <ArrowRight size={16} strokeWidth={1.5} />
              </>
            )}
          </button>
        </div>
      )}

      {/* STEP 3: CONFIRMATION */}
      {step === 3 && (
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", paddingTop: 48, paddingBottom: 80 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(168,124,62,0.1)",
              border: "1px solid rgba(168,124,62,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 32px",
            }}
          >
            <CheckCircle2 size={36} strokeWidth={1.5} style={{ color: "var(--brass)" }} />
          </div>

          <h1 style={{ color: "var(--bone)", marginBottom: 12, fontSize: "clamp(28px, 4vw, 40px)" }}>
            Demande Envoyée
          </h1>
          <p style={{ color: "var(--stone)", fontSize: 15, lineHeight: 1.8, marginBottom: 48 }}>
            Votre reçu CCP a été transmis. La réservation pour{" "}
            <strong style={{ color: "var(--bone)" }}>{venue.name}</strong>{" "}
            le <span className="text-mono" style={{ color: "var(--brass)" }}>{formattedDate}</span>{" "}
            est en attente de validation par le propriétaire.
          </p>

          {/* Next Steps */}
          <div
            style={{
              padding: "32px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(168,124,62,0.12)",
              textAlign: "left",
              marginBottom: 40,
            }}
          >
            <h3 className="text-caption" style={{ color: "var(--brass)", marginBottom: 24 }}>
              Prochaines étapes
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { label: "Demande envoyée", desc: "Votre demande et votre reçu sont entre les mains du propriétaire.", active: true },
                { label: "Vérification du paiement", desc: "Le propriétaire vérifie le versement (24-48h).", pending: true },
                { label: "Confirmation finale", desc: "La salle est officiellement bloquée pour vous !", dimmed: true },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4" style={{ opacity: item.dimmed ? 0.4 : 1 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: item.active ? "rgba(168,124,62,0.15)" : "transparent",
                      border: `1px solid ${item.active ? "var(--brass)" : "rgba(168,124,62,0.2)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {item.active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brass)" }} />}
                    {item.pending && (
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          border: "1.5px solid var(--brass)",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <p style={{ color: "var(--bone)", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{item.label}</p>
                    <p style={{ color: "var(--stone)", fontSize: 13, lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/espace-client"
              className="btn-primary no-underline"
              style={{ height: 48 }}
            >
              Suivre ma réservation
              <ArrowRight size={16} strokeWidth={1.5} />
            </Link>
            <Link
              href="/parcourir"
              className="btn-secondary no-underline"
              style={{ height: 48 }}
            >
              Retour aux salles
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
