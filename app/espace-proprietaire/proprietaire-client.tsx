"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBookingStatus, toggleBlockedDate } from "@/app/actions/bookings";
import { getSignedReceiptUrl, uploadKYCDocument, getSignedKYCUrl } from "@/app/actions/documents";
import { BookingCalendar } from "@/components/venue/booking-calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  Calendar,
  BarChart3,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  LogOut,
  MapPin,
  Users,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  FileText,
  ExternalLink,
  Image,
  Download,
  Shield,
  UploadCloud,
} from "lucide-react";

const VENUE_STATUS_MAP: Record<string, { label: string; badge: string }> = {
  DRAFT: { label: "Brouillon", badge: "badge-stone" },
  PUBLISHED: { label: "Publiée", badge: "badge-malachite" },
  SUSPENDED: { label: "Suspendue", badge: "badge-pomegranate" },
  PENDING_APPROVAL: { label: "En attente", badge: "badge-brass" },
  REJECTED: { label: "Rejetée", badge: "badge-pomegranate" },
};

type Tab = "overview" | "venues" | "requests" | "documents";

const DOC_TYPE_LABELS: Record<string, string> = {
  CIN_RECTO: "Carte d'identité (Recto)",
  CIN_VERSO: "Carte d'identité (Verso)",
  SELFIE: "Selfie avec pièce d'identité",
  ACTE: "Acte de propriété",
  CONTRAT: "Contrat de location",
  AUTORISATION: "Autorisation d'exploitation",
  REGISTRE: "Registre du commerce",
  AUTRE: "Autre document",
};

const DOC_STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  PENDING: { label: "En attente", badge: "badge-brass" },
  APPROVED: { label: "Approuvé", badge: "badge-malachite" },
  REJECTED: { label: "Rejeté", badge: "badge-pomegranate" },
};

export default function EspaceProprietaireClient({ 
  initialVenues, 
  initialReservations,
  initialDocuments,
  userId,
}: { 
  initialVenues: any[], 
  initialReservations: any[],
  initialDocuments: any[],
  userId: string,
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [isPending, startTransition] = useTransition();
  const [selectedVenueForAgenda, setSelectedVenueForAgenda] = useState<string | null>(null);

  const totalVenues = initialVenues.length;
  const activeReservations = initialReservations.filter(r => r.status === 'CONFIRMED').length;
  const pendingRequests = initialReservations.filter(r => r.status === 'PENDING').length;
  const monthlyRevenue = initialReservations
    .filter(r => r.status === 'CONFIRMED' || r.status === 'COMPLETED')
    .reduce((acc, r) => acc + (r.total_price || 0), 0);

  const OWNER_STATS = {
    total_venues: totalVenues,
    active_reservations: activeReservations,
    monthly_revenue: monthlyRevenue,
    pending_requests: pendingRequests,
  };

  const router = useRouter();

  const handleUpdateStatus = (id: string, status: 'CONFIRMED' | 'CANCELLED') => {
    startTransition(async () => {
      await updateBookingStatus(id, status);
      router.refresh();
    });
  };

  const handleToggleBlockDate = (venueId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    startTransition(async () => {
      await toggleBlockedDate(venueId, dateStr);
      router.refresh();
    });
  };

  return (
    <section className="section-obsidian" style={{ paddingTop: 68, minHeight: "100vh" }}>
      <div className="container-saha" style={{ paddingTop: 60, paddingBottom: 120 }}>
        {/* Header */}
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="text-caption mb-3" style={{ color: "var(--brass)" }}>
              Gestion
            </p>
            <h1 style={{ color: "var(--bone)", fontSize: "clamp(28px, 4vw, 40px)" }}>
              Espace Propriétaire
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/ajouter-salle" className="btn-primary no-underline" style={{ height: 40, fontSize: 12 }}>
              <Plus size={14} strokeWidth={2} />
              Ajouter une salle
            </Link>
            <button className="btn-ghost" style={{ color: "var(--stone)", gap: 6 }}>
              <LogOut size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-12" style={{ borderBottom: "1px solid rgba(168,124,62,0.15)" }}>
          {(
            [
              { key: "overview", label: "Vue d'ensemble", icon: BarChart3 },
              { key: "venues", label: "Mes salles", icon: Building2 },
              { key: "requests", label: "Demandes", icon: Calendar, count: OWNER_STATS.pending_requests },
              { key: "documents", label: "Documents KYC", icon: Shield },
            ] as const
          ).map(({ key, label, icon: Icon, ...rest }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="text-caption flex items-center gap-2"
              style={{
                padding: "14px 24px",
                background: "transparent",
                border: "none",
                borderBottom: tab === key ? "2px solid var(--brass)" : "2px solid transparent",
                color: tab === key ? "var(--brass)" : "var(--stone)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={14} strokeWidth={1.5} />
              {label}
              {"count" in rest && (rest as { count: number }).count > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor: "var(--brass)",
                    color: "var(--bone)",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {(rest as { count: number }).count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === "overview" && (
          <div>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {[
                { label: "Salles", value: OWNER_STATS.total_venues, icon: Building2 },
                { label: "Réservations actives", value: OWNER_STATS.active_reservations, icon: Calendar },
                {
                  label: "Revenus du mois",
                  value: `${(OWNER_STATS.monthly_revenue / 1000).toFixed(0)}K DA`,
                  icon: TrendingUp,
                },
                { label: "En attente", value: OWNER_STATS.pending_requests, icon: Clock },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: "24px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(168,124,62,0.1)",
                  }}
                >
                  <stat.icon size={18} strokeWidth={1.5} style={{ color: "var(--brass)", marginBottom: 12 }} />
                  <p className="text-mono" style={{ fontSize: 28, color: "var(--candlelight)", marginBottom: 4 }}>
                    {stat.value}
                  </p>
                  <p className="text-caption" style={{ color: "var(--stone)", margin: 0 }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent requests preview */}
            {initialReservations.filter(r => r.status === 'PENDING').length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 style={{ color: "var(--bone)", margin: 0 }}>Demandes récentes</h3>
                  <button onClick={() => setTab("requests")} className="btn-ghost" style={{ color: "var(--brass)" }}>
                    Voir tout <ArrowRight size={12} strokeWidth={1.5} />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {initialReservations.filter(r => r.status === 'PENDING').slice(0, 3).map((req) => (
                    <RequestCard key={req.id} request={req} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Venues tab */}
        {tab === "venues" && (
          <div className="flex flex-col gap-4">
            {selectedVenueForAgenda ? (
              <div className="bg-white/5 border border-[#a87c3e]/20 rounded-xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-medium text-[#f3eed9]">Agenda de la salle</h2>
                    <p className="text-[#a39b8c] text-sm mt-1">Cliquez sur une date pour la bloquer ou la débloquer.</p>
                  </div>
                  <button 
                    onClick={() => setSelectedVenueForAgenda(null)}
                    className="btn-ghost text-[#a87c3e]"
                  >
                    <ArrowLeft size={16} className="mr-2" /> Retour
                  </button>
                </div>
                
                <div className="flex justify-center rounded-xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,124,62,0.15)" }}>
                  <BookingCalendar
                    mode="single"
                    reservations={initialReservations.filter(r => r.venue_id === selectedVenueForAgenda)}
                    onSelectDate={(date) => {
                      if (date) {
                        handleToggleBlockDate(selectedVenueForAgenda, date);
                      }
                    }}
                    ownerMode={true}
                  />
                </div>
              </div>
            ) : (
              initialVenues.map((venue) => {
              const statusConfig = VENUE_STATUS_MAP[venue.status] || VENUE_STATUS_MAP.DRAFT;
              return (
                <div
                  key={venue.id}
                  style={{
                    padding: "28px 32px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(168,124,62,0.1)",
                  }}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 style={{ color: "var(--bone)", fontSize: 15, margin: 0 }}>
                          {venue.name}
                        </h3>
                        <span className={`badge ${statusConfig.badge}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1" style={{ color: "var(--stone)", fontSize: 13 }}>
                          <MapPin size={12} strokeWidth={1.5} />
                          {venue.wilaya}
                        </span>
                        <span className="flex items-center gap-1" style={{ color: "var(--stone)", fontSize: 13 }}>
                          <Users size={12} strokeWidth={1.5} />
                          {venue.capacity_max}
                        </span>
                        <span className="text-mono" style={{ fontSize: 13, color: "var(--brass)" }}>
                          {venue.price_per_day.toLocaleString("fr-DZ")} DA/jour
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedVenueForAgenda(venue.id)}
                        className="btn-ghost"
                        style={{ color: "var(--brass)" }}
                      >
                        <Calendar size={14} strokeWidth={1.5} />
                        Agenda
                      </button>
                      <Link
                        href={`/salle/${venue.id}`}
                        className="btn-ghost no-underline"
                        style={{ color: "var(--stone)" }}
                      >
                        <Eye size={14} strokeWidth={1.5} />
                        Aperçu
                      </Link>
                    </div>
                  </div>
                </div>
              );
              })
            )}
          </div>
        )}

        {/* Requests tab */}
        {tab === "requests" && (
          <div className="flex flex-col gap-4">
            {initialReservations.filter(r => r.status === 'PENDING').length === 0 ? (
              <div className="text-center" style={{ padding: "80px 0" }}>
                <Calendar size={40} strokeWidth={1} style={{ color: "var(--stone)", margin: "0 auto 16px" }} />
                <p className="text-body" style={{ color: "var(--stone)" }}>
                  Aucune demande en attente.
                </p>
              </div>
            ) : (
              initialReservations.filter(r => r.status === 'PENDING').map((req) => (
                <RequestCard key={req.id} request={req} showActions onUpdateStatus={handleUpdateStatus} />
              ))
            )}
          </div>
        )}

        {/* Documents KYC tab */}
        {tab === "documents" && (
          <DocumentsTab initialDocuments={initialDocuments} userId={userId} />
        )}
      </div>
    </section>
  );
}

/* ── Request Card ── */
function RequestCard({
  request,
  showActions = false,
  onUpdateStatus,
}: {
  request: any;
  showActions?: boolean;
  onUpdateStatus?: (id: string, status: 'CONFIRMED' | 'CANCELLED') => void;
}) {
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  const formattedDate = request.date
    ? new Date(request.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const formattedCreated = request.created_at
    ? new Date(request.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    : "";

  const handleViewReceipt = async () => {
    if (receiptUrl) {
      setReceiptUrl(null);
      return;
    }
    if (!request.ccp_receipt_url) return;
    setLoadingReceipt(true);
    const result = await getSignedReceiptUrl(request.ccp_receipt_url);
    if (result.url) setReceiptUrl(result.url);
    setLoadingReceipt(false);
  };

  return (
    <div
      style={{
        padding: "24px 28px",
        borderRadius: 6,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(168,124,62,0.1)",
      }}
    >
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-brass">
              <Clock size={11} strokeWidth={1.5} />
              En attente
            </span>
            <span className="text-mono" style={{ fontSize: 11, color: "var(--stone)" }}>
              {formattedCreated}
            </span>
          </div>
          <p style={{ color: "var(--bone)", fontSize: 15, fontWeight: 500, margin: "0 0 4px" }}>
            {request.client_name}
          </p>
          <p style={{ color: "var(--stone)", fontSize: 13, margin: "0 0 4px" }}>
            {request.venue_name} · {formattedDate}
          </p>
          {request.client_phone && (
            <p style={{ color: "var(--stone)", fontSize: 12, margin: 0, opacity: 0.7 }}>
              Tél: {request.client_phone}
            </p>
          )}
          {request.client_message && (
            <p style={{ color: "var(--stone)", fontSize: 12, margin: "6px 0 0", fontStyle: "italic", opacity: 0.8 }}>
              "{request.client_message}"
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-mono" style={{ fontSize: 18, color: "var(--candlelight)", margin: 0 }}>
            {(request.total || 0).toLocaleString("fr-DZ")} DA
          </p>
          {/* CCP Receipt button */}
          {request.ccp_receipt_url && (
            <button
              onClick={handleViewReceipt}
              className="btn-ghost"
              style={{ color: "var(--brass)", height: 30, fontSize: 11, marginTop: 6 }}
              disabled={loadingReceipt}
            >
              {loadingReceipt ? (
                <span style={{ fontSize: 11 }}>Chargement...</span>
              ) : (
                <>
                  <Image size={12} strokeWidth={1.5} />
                  {receiptUrl ? 'Masquer' : 'Voir le reçu CCP'}
                </>
              )}
            </button>
          )}
          {!request.ccp_receipt_url && (
            <p style={{ color: "var(--stone)", fontSize: 11, margin: "8px 0 0", opacity: 0.6 }}>
              Reçu CCP non soumis
            </p>
          )}
          {showActions && onUpdateStatus && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onUpdateStatus(request.id, 'CONFIRMED')}
                className="btn-primary"
                style={{ height: 36, fontSize: 11, padding: "0 16px" }}
              >
                <CheckCircle size={13} strokeWidth={1.5} />
                Accepter
              </button>
              <button
                onClick={() => onUpdateStatus(request.id, 'CANCELLED')}
                className="btn-secondary"
                style={{ height: 36, fontSize: 11, padding: "0 16px", color: "var(--pomegranate)", borderColor: "var(--pomegranate)" }}
              >
                <XCircle size={13} strokeWidth={1.5} />
                Refuser
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Receipt viewer */}
      {receiptUrl && (
        <div
          style={{
            marginTop: 16,
            padding: "16px",
            borderRadius: 4,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(168,124,62,0.08)",
            textAlign: "center",
          }}
        >
          <p className="text-caption" style={{ color: "var(--brass)", marginBottom: 12 }}>
            Reçu CCP soumis par le client
          </p>
          {request.ccp_receipt_url?.endsWith('.pdf') ? (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost no-underline"
              style={{ color: "var(--brass)" }}
            >
              <ExternalLink size={14} strokeWidth={1.5} />
              Ouvrir le PDF
            </a>
          ) : (
            <img
              src={receiptUrl}
              alt="Reçu CCP"
              style={{
                maxWidth: "100%",
                maxHeight: 400,
                borderRadius: 4,
                border: "1px solid rgba(168,124,62,0.1)",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Documents KYC Tab ── */
function DocumentsTab({ initialDocuments, userId }: { initialDocuments: any[], userId: string }) {
  const [documents] = useState(initialDocuments);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  const IDENTITY_DOCS = ['CIN_RECTO', 'CIN_VERSO', 'SELFIE'];
  const VENUE_DOCS = ['REGISTRE', 'CONTRAT', 'ACTE', 'AUTORISATION', 'AUTRE'];

  const handleUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 5 Mo.');
      return;
    }
    setUploading(docType);
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.append('file', file);
    const result = await uploadKYCDocument(docType, formData);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(`${DOC_TYPE_LABELS[docType] || docType} téléversé avec succès.`);
      window.location.reload();
    }
    setUploading(null);
  };

  const handlePreview = async (doc: any) => {
    if (previewDocId === doc.id) {
      setPreviewUrl(null);
      setPreviewDocId(null);
      return;
    }
    const result = await getSignedKYCUrl(doc.url);
    if (result.url) {
      setPreviewUrl(result.url);
      setPreviewDocId(doc.id);
    }
  };

  const getExistingDoc = (docType: string) => documents.find((d: any) => d.doc_type === docType);

  return (
    <div>
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 6, background: 'rgba(139,46,32,0.1)', border: '1px solid rgba(139,46,32,0.2)', color: 'var(--pomegranate)', fontSize: 13 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 6, background: 'rgba(72,121,54,0.1)', border: '1px solid rgba(72,121,54,0.2)', color: 'var(--malachite)', fontSize: 13 }}>
          {success}
        </div>
      )}

      {/* Identity Documents */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ color: 'var(--bone)', fontSize: 16, marginBottom: 16 }}>
          <Shield size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: 'var(--brass)' }} />
          Vérification d&apos;identité
        </h3>
        <p style={{ color: 'var(--stone)', fontSize: 13, marginBottom: 20, opacity: 0.8 }}>
          Téléversez votre carte d&apos;identité nationale (recto et verso) ainsi qu&apos;un selfie pour vérification.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {IDENTITY_DOCS.map(docType => {
            const existing = getExistingDoc(docType);
            const sc = existing ? DOC_STATUS_LABELS[existing.status] || DOC_STATUS_LABELS.PENDING : null;
            return (
              <div key={docType} style={{ padding: 20, borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(168,124,62,0.1)' }}>
                <p style={{ color: 'var(--bone)', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{DOC_TYPE_LABELS[docType]}</p>
                {existing ? (
                  <div>
                    <span className={`badge ${sc?.badge}`} style={{ marginBottom: 8, display: 'inline-block' }}>{sc?.label}</span>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handlePreview(existing)} className="btn-ghost" style={{ color: 'var(--brass)', height: 30, fontSize: 11 }}>
                        <Eye size={12} strokeWidth={1.5} />
                        {previewDocId === existing.id ? 'Masquer' : 'Aperçu'}
                      </button>
                    </div>
                    {previewDocId === existing.id && previewUrl && (
                      <div style={{ marginTop: 12 }}>
                        <img src={previewUrl} alt={DOC_TYPE_LABELS[docType]} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4, border: '1px solid rgba(168,124,62,0.1)' }} />
                        <a href={previewUrl} download className="btn-ghost no-underline block mt-2" style={{ color: 'var(--stone)', fontSize: 11 }}>
                          <Download size={12} strokeWidth={1.5} /> Télécharger
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <label style={{ cursor: uploading === docType ? 'wait' : 'pointer', display: 'block' }}>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleUpload(docType, e)} style={{ display: 'none' }} disabled={!!uploading} />
                    <div style={{ padding: 16, borderRadius: 4, border: '2px dashed rgba(168,124,62,0.2)', textAlign: 'center' }}>
                      {uploading === docType ? (
                        <p style={{ color: 'var(--brass)', fontSize: 12, margin: 0 }}>Téléversement...</p>
                      ) : (
                        <>
                          <UploadCloud size={20} strokeWidth={1.5} style={{ color: 'var(--stone)', margin: '0 auto 8px', display: 'block' }} />
                          <p style={{ color: 'var(--stone)', fontSize: 11, margin: 0 }}>Cliquez pour téléverser</p>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Venue Ownership Documents */}
      <div>
        <h3 style={{ color: 'var(--bone)', fontSize: 16, marginBottom: 16 }}>
          <FileText size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: 'var(--brass)' }} />
          Justificatifs de propriété / exploitation
        </h3>
        <p style={{ color: 'var(--stone)', fontSize: 13, marginBottom: 20, opacity: 0.8 }}>
          Soumettez les documents prouvant votre droit d&apos;exploiter vos salles.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VENUE_DOCS.map(docType => {
            const existing = getExistingDoc(docType);
            const sc = existing ? DOC_STATUS_LABELS[existing.status] || DOC_STATUS_LABELS.PENDING : null;
            return (
              <div key={docType} style={{ padding: 20, borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(168,124,62,0.1)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p style={{ color: 'var(--bone)', fontSize: 13, fontWeight: 500, margin: 0 }}>{DOC_TYPE_LABELS[docType]}</p>
                  {existing && <span className={`badge ${sc?.badge}`}>{sc?.label}</span>}
                </div>
                {existing ? (
                  <div>
                    <p style={{ color: 'var(--stone)', fontSize: 11, margin: '4px 0 8px' }}>
                      Soumis le {new Date(existing.created_at).toLocaleDateString('fr-FR')}
                      {existing.venues?.name && ` · ${existing.venues.name}`}
                    </p>
                    <button onClick={() => handlePreview(existing)} className="btn-ghost" style={{ color: 'var(--brass)', height: 28, fontSize: 11 }}>
                      <Eye size={12} strokeWidth={1.5} />
                      {previewDocId === existing.id ? 'Masquer' : 'Aperçu'}
                    </button>
                    {previewDocId === existing.id && previewUrl && (
                      <div style={{ marginTop: 12 }}>
                        <img src={previewUrl} alt={DOC_TYPE_LABELS[docType]} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4, border: '1px solid rgba(168,124,62,0.1)' }} />
                        <a href={previewUrl} download className="btn-ghost no-underline block mt-2" style={{ color: 'var(--stone)', fontSize: 11 }}>
                          <Download size={12} strokeWidth={1.5} /> Télécharger
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <label style={{ cursor: uploading === docType ? 'wait' : 'pointer', display: 'block', marginTop: 8 }}>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleUpload(docType, e)} style={{ display: 'none' }} disabled={!!uploading} />
                    <div style={{ padding: 12, borderRadius: 4, border: '2px dashed rgba(168,124,62,0.2)', textAlign: 'center' }}>
                      {uploading === docType ? (
                        <p style={{ color: 'var(--brass)', fontSize: 12, margin: 0 }}>Téléversement...</p>
                      ) : (
                        <p style={{ color: 'var(--stone)', fontSize: 11, margin: 0 }}>
                          <UploadCloud size={14} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                          Cliquez pour téléverser
                        </p>
                      )}
                    </div>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
