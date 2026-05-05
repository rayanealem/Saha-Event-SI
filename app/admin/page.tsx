import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboard from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as any)?.role !== "ADMIN") {
    redirect("/espace-client");
  }

  // Fetch pending KYC owners
  const { data: pendingOwners } = await supabase
    .from("profiles")
    .select("id, full_name, role, kyc_status, created_at, phone")
    .eq("kyc_status", "PENDING")
    .order("created_at", { ascending: true });

  // Fetch all venues with owner info
  const { data: pendingVenues } = await supabase
    .from("venues")
    .select("id, name, wilaya, capacity_max, price_per_day, status, created_at, owner_id, profiles:owner_id(full_name)")
    .eq("status", "DRAFT")
    .order("created_at", { ascending: true });

  // Stats
  const { count: totalOwners } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "OWNER");

  const { count: totalVenues } = await supabase
    .from("venues")
    .select("id", { count: "exact", head: true });

  const { count: activeReservations } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .in("status", ["PENDING", "CONFIRMED"]);

  const stats = {
    total_owners: totalOwners || 0,
    total_venues: totalVenues || 0,
    pending_approvals: (pendingOwners?.length || 0) + (pendingVenues?.length || 0),
    active_reservations: activeReservations || 0,
  };

  return (
    <AdminDashboard
      stats={stats}
      pendingOwners={pendingOwners || []}
      pendingVenues={(pendingVenues || []).map((v: any) => ({
        ...v,
        owner_name: v.profiles?.full_name || "Inconnu",
      }))}
    />
  );
}
