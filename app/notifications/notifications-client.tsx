"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  FileText,
  X,
  Filter,
  ChevronDown,
  Loader2,
  Inbox,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getNotificationsPaginated,
  markAsRead,
  markAllAsRead,
} from "@/app/actions/notifications";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

type FilterType = "all" | "unread" | "read";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "unread", label: "Non lues" },
  { key: "read", label: "Lues" },
];

const PAGE_SIZE = 20;

export function NotificationsPageClient({
  initialNotifications,
  initialTotal,
  initialUnread,
}: {
  initialNotifications: Notification[];
  initialTotal: number;
  initialUnread: number;
}) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [total, setTotal] = useState(initialTotal);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const hasMore = notifications.length < total;

  // ── Realtime subscription ──
  useEffect(() => {
    const supabase = createClient();
    let channelRef: any = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channelRef = supabase
        .channel(`notifications-page-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            if (filter !== "read") {
              setNotifications((prev) => [newNotif, ...prev]);
              setTotal((prev) => prev + 1);
            }
            setUnreadCount((prev) => prev + 1);
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channelRef) {
        supabase.removeChannel(channelRef);
      }
    };
  }, [filter]);

  // ── Change filter ──
  const handleFilterChange = useCallback(async (newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1);
    setLoading(true);

    const result = await getNotificationsPaginated(1, PAGE_SIZE, newFilter);
    if (result.data) {
      setNotifications(result.data);
      setTotal(result.total);
    }
    setLoading(false);
  }, []);

  // ── Load more ──
  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoading(true);

    const result = await getNotificationsPaginated(nextPage, PAGE_SIZE, filter);
    if (result.data) {
      setNotifications((prev) => [...prev, ...result.data!]);
      setTotal(result.total);
      setPage(nextPage);
    }
    setLoading(false);
  }, [page, filter]);

  // ── Mark single as read ──
  const handleMarkAsRead = useCallback(
    async (id: string) => {
      const notif = notifications.find((n) => n.id === id);
      if (!notif || notif.is_read) return;

      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // If filtering by unread, remove from list
      if (filter === "unread") {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    },
    [notifications, filter]
  );

  // ── Mark all as read ──
  const handleMarkAllAsRead = useCallback(async () => {
    setMarkingAll(true);
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    if (filter === "unread") {
      setNotifications([]);
      setTotal(0);
    }
    setMarkingAll(false);
  }, [filter]);

  // ── Icon by type ──
  const getIcon = (type: string) => {
    switch (type) {
      case "booking_confirmed":
      case "account_approved":
        return <Check size={16} style={{ color: "#4CAF50" }} />;
      case "booking_refused":
      case "booking_cancelled":
      case "account_refused":
        return <X size={16} style={{ color: "var(--pomegranate)" }} />;
      case "booking_request":
        return <Calendar size={16} style={{ color: "var(--brass)" }} />;
      case "new_document":
        return <FileText size={16} style={{ color: "var(--brass)" }} />;
      default:
        return <Bell size={16} style={{ color: "var(--stone)" }} />;
    }
  };

  // ── Time formatting ──
  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return "";
    }
  };

  return (
    <section
      className="section-obsidian"
      style={{ paddingTop: 68, minHeight: "100vh" }}
    >
      <div
        className="container-saha"
        style={{ paddingTop: 60, paddingBottom: 120, maxWidth: 780 }}
      >
        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bell
                size={14}
                strokeWidth={1.5}
                style={{ color: "var(--brass)" }}
              />
              <p
                className="text-caption"
                style={{ color: "var(--brass)", margin: 0 }}
              >
                Centre de notifications
              </p>
            </div>
            <h1
              style={{
                color: "var(--bone)",
                fontSize: "clamp(28px, 4vw, 40px)",
              }}
            >
              Notifications
            </h1>
            <p
              className="text-body"
              style={{ color: "var(--stone)", margin: "8px 0 0" }}
            >
              {unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                : "Aucune notification non lue"}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn-secondary"
              style={{
                height: 40,
                fontSize: 12,
                padding: "0 20px",
                opacity: markingAll ? 0.5 : 1,
              }}
              disabled={markingAll}
            >
              {markingAll ? (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <CheckCheck size={14} strokeWidth={1.5} />
              )}
              Tout marquer lu
            </button>
          )}
        </div>

        {/* ── Filter tabs ── */}
        <div
          className="flex gap-0 mb-8"
          style={{ borderBottom: "1px solid rgba(168,124,62,0.15)" }}
        >
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className="text-caption flex items-center gap-2"
              style={{
                padding: "12px 20px",
                background: "transparent",
                border: "none",
                borderBottom:
                  filter === key
                    ? "2px solid var(--brass)"
                    : "2px solid transparent",
                color: filter === key ? "var(--brass)" : "var(--stone)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {label}
              {key === "unread" && unreadCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor: "var(--pomegranate)",
                    color: "var(--bone)",
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "0 4px",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Notification list ── */}
        {loading && notifications.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <Loader2
              size={28}
              strokeWidth={1.5}
              className="animate-spin"
              style={{ color: "var(--brass)", margin: "0 auto 16px" }}
            />
            <p className="text-body" style={{ color: "var(--stone)" }}>
              Chargement…
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(168,124,62,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <Inbox
                size={28}
                strokeWidth={1}
                style={{ color: "var(--stone)" }}
              />
            </div>
            <p
              style={{
                color: "var(--bone)",
                fontSize: 16,
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              {filter === "unread"
                ? "Tout est lu !"
                : filter === "read"
                  ? "Aucune notification lue"
                  : "Aucune notification"}
            </p>
            <p className="text-body" style={{ color: "var(--stone)" }}>
              {filter === "unread"
                ? "Vous êtes à jour. Toutes vos notifications ont été lues."
                : "Les notifications apparaîtront ici quand vous en recevrez."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {notifications.map((n, i) => (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                style={{
                  padding: "20px 24px",
                  background: n.is_read
                    ? "transparent"
                    : "rgba(168,124,62,0.04)",
                  borderBottom:
                    i < notifications.length - 1
                      ? "1px solid rgba(168,124,62,0.08)"
                      : "none",
                  cursor: n.is_read ? "default" : "pointer",
                  transition: "background 0.15s ease",
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  borderRadius: 4,
                }}
                onMouseEnter={(e) => {
                  if (!n.is_read)
                    e.currentTarget.style.background =
                      "rgba(168,124,62,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = n.is_read
                    ? "transparent"
                    : "rgba(168,124,62,0.04)";
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(168,124,62,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {getIcon(n.type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: n.is_read ? 400 : 600,
                        color: "var(--bone)",
                        lineHeight: 1.4,
                      }}
                    >
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "var(--brass)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: 13,
                      color: "var(--stone)",
                      lineHeight: 1.5,
                    }}
                  >
                    {n.message}
                  </p>
                  <p
                    className="text-mono"
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "rgba(168,124,62,0.5)",
                    }}
                  >
                    {formatTime(n.created_at)}
                  </p>
                </div>
              </div>
            ))}

            {/* ── Load more ── */}
            {hasMore && (
              <div
                style={{ padding: "24px 0", textAlign: "center" }}
              >
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="btn-secondary"
                  style={{
                    height: 40,
                    fontSize: 12,
                    padding: "0 24px",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {loading ? (
                    <Loader2
                      size={14}
                      strokeWidth={1.5}
                      className="animate-spin"
                    />
                  ) : (
                    <ChevronDown size={14} strokeWidth={1.5} />
                  )}
                  Charger plus
                </button>
                <p
                  className="text-mono"
                  style={{
                    color: "var(--stone)",
                    fontSize: 11,
                    marginTop: 8,
                    opacity: 0.6,
                  }}
                >
                  {notifications.length} sur {total}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
