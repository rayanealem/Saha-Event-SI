import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { SalleDetailClient } from "@/components/salle-detail-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SalleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch venue + its photos + bookings in parallel
  const [venueResult, photosResult, bookingsResult] = await Promise.all([
    (supabase.from("venues").select("*").eq("id", id).single() as any),
    (supabase
      .from("venue_photos")
      .select("url, display_order")
      .eq("venue_id", id)
      .order("display_order", { ascending: true }) as any),
    (supabase
      .from("reservations")
      .select("start_date, end_date, status")
      .eq("venue_id", id)
      .in("status", ["PENDING", "CONFIRMED", "BLOCKED"]) as any),
  ]);

  const venue = venueResult.data;

  if (!venue) {
    notFound();
  }

  // Build images array — prefer actual photos, fallback to generated ones
  const photos: string[] = (photosResult.data || []).map((p: { url: string }) => p.url);
  const images =
    photos.length > 0
      ? photos
      : [
          "/images/venue-1.png",
          "/images/venue-2.png",
          "/images/venue-3.png",
        ];

  // Shape data for client
  const venueData = {
    id: venue.id,
    name: venue.name,
    wilaya: venue.wilaya,
    address: venue.address || "",
    price_per_day: venue.price_per_day,
    deposit_percentage: venue.deposit_percentage || 30,
    capacity_max: venue.capacity_max,
    area_m2: venue.area_m2 || 0,
    rating: 4.8,
    totalReviews: 124,
    description: venue.description || "",
    options: (venue.options as string[]) || [],
    images,
    reviews: [
      {
        id: "r1",
        name: "Amina B.",
        rating: 5,
        date: "Mars 2026",
        comment:
          "Une salle magnifique ! Le service était impeccable et tous nos invités étaient éblouis. Je recommande sans hésiter.",
      },
      {
        id: "r2",
        name: "Yacine K.",
        rating: 5,
        date: "Février 2026",
        comment:
          "Un endroit absolument magique. L'espace extérieur est un vrai bijou pour les photos.",
      },
      {
        id: "r3",
        name: "Sarah M.",
        rating: 4,
        date: "Janvier 2026",
        comment:
          "Très belle salle avec un personnel attentif. Un cadre exceptionnel pour notre mariage.",
      },
    ],
  };

  return <SalleDetailClient venue={venueData} bookings={bookingsResult.data || []} />;
}
