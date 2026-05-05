import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EspaceProprietaireClient from "./proprietaire-client";
import { getOwnerBookings } from "@/app/actions/bookings";

export default async function EspaceProprietairePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ensure user is an owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as any)?.role !== "OWNER" && (profile as any)?.role !== "ADMIN") {
    redirect("/espace-client");
  }

  // Fetch venues
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, wilaya, status, price_per_day, capacity_max, reservations(id, start_date, end_date, status)")
    .eq("owner_id", user.id);

  // Fetch reservations
  const { data: reservations } = await getOwnerBookings();

  return (
    <EspaceProprietaireClient 
      initialVenues={venues || []} 
      initialReservations={reservations || []} 
    />
  );
}
