'use client'

import { useState } from "react"
import { Check, X, FileText, ShieldCheck } from "lucide-react"
import { updateBookingStatus } from "@/app/actions/bookings"

export function ReservationRequestCard({ booking, profile, venue }: { booking: any, profile: any, venue: any }) {
  const [showReceipt, setShowReceipt] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAction = async (status: 'CONFIRMED' | 'CANCELLED' | 'RECEIPT_INVALID') => {
    setIsSubmitting(true)
    await updateBookingStatus(booking.id, status)
    setIsSubmitting(false)
  }

  const receiptUrl = booking.ccp_receipt_url 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ccp_receipts/${booking.ccp_receipt_url}`
    : "https://images.unsplash.com/photo-1620002093390-34446a86f91d?auto=format&fit=crop&q=80&w=800"

  return (
    <div className="border border-border p-10 md:p-14 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-primary text-background label-text px-8 py-3">
        Action Requise
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 border-b border-border pb-8 mt-4 md:mt-0">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-foreground/5 border border-border flex items-center justify-center font-bodoni text-4xl italic text-foreground shrink-0">
            {profile?.full_name?.[0]?.toUpperCase() || "C"}
          </div>
          <div>
            <h3 className="label-text text-foreground">{profile?.full_name || "Client"}</h3>
            <p className="mono-text text-xs text-foreground/50 flex items-center gap-2 mt-2">
              {profile?.kyc_verified && <ShieldCheck className="w-4 h-4 text-primary" />} {profile?.kyc_verified ? "Client Vérifié" : "Non Vérifié"}
            </p>
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="font-bodoni text-2xl text-foreground">{venue?.name}</p>
          <p className="mono-text text-xs text-foreground/50 mt-2">{new Date(booking.start_date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="bg-foreground/5 border border-border p-8 mb-10 grid md:grid-cols-2 gap-8">
        <div>
          <p className="label-text text-foreground/50 mb-4">Montant Total</p>
          <p className="font-bodoni text-3xl text-foreground">{booking.total_price} DA</p>
        </div>
        <div>
          <p className="label-text text-foreground/50 mb-4">Acompte à vérifier</p>
          <div className="flex items-center gap-6">
            <p className="font-bodoni text-3xl text-primary">{booking.deposit_amount} DA</p>
            <button 
              onClick={() => setShowReceipt(!showReceipt)}
              className="flex items-center gap-3 label-text text-foreground bg-background border border-border px-6 py-3 hover:border-border/80 transition-colors"
            >
              <FileText className="w-4 h-4" /> Voir Reçu
            </button>
          </div>
        </div>
      </div>

      {showReceipt && (
        <div className="mb-10 p-8 border border-border bg-foreground/5 relative">
          <button 
            onClick={() => setShowReceipt(false)}
            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-background border border-border hover:border-destructive text-foreground z-10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="label-text text-foreground mb-6 text-center">Reçu CCP soumis par le client</p>
          <div className="w-full h-[400px] bg-background border border-border flex items-center justify-center overflow-hidden relative">
            <img src={receiptUrl} alt="Reçu" className="w-full h-full object-contain p-4" />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <button 
          onClick={() => handleAction('CANCELLED')}
          disabled={isSubmitting}
          className="flex-1 h-14 bg-background border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground label-text transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <X className="w-4 h-4" strokeWidth={1.5} /> Rejeter
        </button>
        <button 
          onClick={() => handleAction('CONFIRMED')}
          disabled={isSubmitting}
          className="flex-1 h-14 bg-foreground text-background hover:bg-foreground/90 label-text transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <Check className="w-4 h-4" strokeWidth={1.5} /> Accepter le paiement
        </button>
      </div>
    </div>
  )
}
