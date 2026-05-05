"use client";

import { useState, useEffect } from "react";
import { Bell, X, Check, Calendar, FileText, AlertTriangle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, type, is_read, created_at, link")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 15));
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id: string) => {
    const supabase = createClient() as any;
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "BOOKING_CONFIRMED":
        return <Check size={14} style={{ color: "#4CAF50" }} />;
      case "BOOKING_CANCELLED":
        return <X size={14} style={{ color: "var(--pomegranate)" }} />;
      case "NEW_BOOKING":
        return <Calendar size={14} style={{ color: "var(--brass)" }} />;
      case "RECEIPT_UPLOADED":
        return <FileText size={14} style={{ color: "var(--brass)" }} />;
      default:
        return <AlertTriangle size={14} style={{ color: "var(--stone)" }} />;
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notif-menu]")) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  return (
    <div className="relative" data-notif-menu>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "transparent",
          border: "1px solid rgba(168,124,62,0.2)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          color: "var(--bone)",
          transition: "all 0.2s ease",
        }}
        aria-label="Notifications"
      >
        <Bell size={16} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--pomegranate)",
              border: "2px solid var(--obsidian)",
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            maxHeight: 420,
            overflowY: "auto",
            background: "var(--obsidian)",
            border: "1px solid rgba(168,124,62,0.2)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 100,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(168,124,62,0.1)",
            }}
          >
            <span style={{ color: "var(--bone)", fontWeight: 600, fontSize: 14 }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: 12,
                  color: "var(--brass)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Body */}
          {notifications.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <p style={{ color: "var(--stone)", fontSize: 13 }}>
                Aucune notification
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(168,124,62,0.06)",
                  background: n.is_read ? "transparent" : "rgba(168,124,62,0.04)",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(168,124,62,0.08)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = n.is_read
                    ? "transparent"
                    : "rgba(168,124,62,0.04)")
                }
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: n.is_read ? 400 : 600,
                      color: "var(--bone)",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.title}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 12,
                      color: "var(--stone)",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.message}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 11,
                      color: "rgba(168,124,62,0.5)",
                    }}
                  >
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
                {!n.is_read && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--brass)",
                      marginTop: 8,
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
