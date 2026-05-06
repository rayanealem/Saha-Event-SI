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
  const { data: notifications, error: notifError } = await supabase
    .from("notifications")
    .select("id, title, message, type, is_read, created_at, link")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(0, 19);

  if (notifError) {
    console.error("[NotificationsPage] fetch error:", notifError);
  }
  console.log("[NotificationsPage] user.id:", user.id, "fetched:", notifications?.length ?? 0);

  // Fetch total count
  const { count: totalCount, error: countError } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    console.error("[NotificationsPage] count error:", countError);
  }

  // Fetch unread count
  const { count: unreadCount, error: unreadError } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (unreadError) {
    console.error("[NotificationsPage] unread count error:", unreadError);
  }

  return (
    <NotificationsPageClient
      initialNotifications={notifications || []}
      initialTotal={totalCount || 0}
      initialUnread={unreadCount || 0}
    />
  );
}
