import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ReservationClient } from "@/components/reservation-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReservationPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = (await createClient()) as any;

  // Auth guard — server-side check (middleware also handles this, but belt-and-suspenders)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signup?redirect_to=/reservation/${id}`);
  }

  // Fetch venue details
  const { data: venue, error } = await supabase
    .from("venues")
    .select("id, name, wilaya, address, price_per_day, deposit_percentage, owner_id, ccp_name, ccp_number, ccp_key")
    .eq("id", id)
    .single();

  if (error || !venue) {
    notFound();
  }

  // Fetch venue photos
  const { data: photos } = await supabase
    .from("venue_photos")
    .select("url, display_order")
    .eq("venue_id", id)
    .order("display_order", { ascending: true });

  // Fetch bookings for calendar
  const { data: bookings } = await supabase
    .from("reservations")
    .select("start_date, end_date, status")
    .eq("venue_id", id)
    .in("status", ["PENDING", "CONFIRMED", "BLOCKED"]);

  const venueData = {
    ...venue,
    deposit_percentage: venue.deposit_percentage || 30,
    venue_photos: photos || [],
  };

  return (
    <section
      className="section-obsidian"
      style={{ paddingTop: 100, minHeight: "100vh" }}
    >
      <ReservationClient venue={venueData} bookings={bookings || []} />
    </section>
  );
}
