import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { EspaceClientContent } from "./client-content";

export default async function EspaceClientPage() {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, role, kyc_status")
    .eq("id", user.id)
    .single();

  // Fetch real reservations with venue names
  const { data: reservations } = await supabase
    .from("reservations")
    .select("id, start_date, end_date, total_price, deposit_amount, status, reference_code, created_at, venues(name, wilaya)")
    .eq("client_id", user.id)
    .neq("status", "BLOCKED")
    .order("created_at", { ascending: false });

  return (
    <EspaceClientContent
      profile={profile || { full_name: "", email: user.email, phone: "", role: "CLIENT", kyc_status: "PENDING" }}
      reservations={reservations || []}
    />
  );
}
