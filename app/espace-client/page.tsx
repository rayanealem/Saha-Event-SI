import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { EspaceClientContent } from "./client-content";

export const dynamic = "force-dynamic";

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

  // Build profile with user_metadata fallback
  const meta = user.user_metadata || {};
  const finalProfile = {
    full_name: profile?.full_name || meta.full_name || "",
    email: profile?.email || user.email || "",
    phone: profile?.phone || meta.phone || "",
    role: profile?.role || meta.role || "CLIENT",
    kyc_status: profile?.kyc_status || "PENDING",
  };

  // Fetch real reservations with venue names and CCP receipt URL
  const { data: reservations } = await supabase
    .from("reservations")
    .select("id, start_date, end_date, total_price, deposit_amount, status, reference_code, created_at, ccp_receipt_url, venues(name, wilaya)")
    .eq("client_id", user.id)
    .neq("status", "BLOCKED")
    .order("created_at", { ascending: false });

  return (
    <EspaceClientContent
      profile={finalProfile}
      reservations={reservations || []}
    />
  );
}
