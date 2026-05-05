import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { NotificationsPageClient } from "./notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = (await createClient()) as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch initial notifications (first page)
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, type, is_read, created_at, link")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(0, 19);

  // Fetch total count
  const { count: totalCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Fetch unread count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return (
    <NotificationsPageClient
      initialNotifications={notifications || []}
      initialTotal={totalCount || 0}
      initialUnread={unreadCount || 0}
    />
  );
}
