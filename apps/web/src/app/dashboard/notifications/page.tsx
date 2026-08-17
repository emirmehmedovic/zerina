"use client";

import { useEffect, useState, useCallback } from "react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  RefreshCw,
  Filter,
} from "lucide-react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
  ORDER_NEW: { label: "New Order", icon: "🛒", color: "text-emerald-400" },
  ORDER_PAID: { label: "Payment", icon: "💰", color: "text-emerald-400" },
  ORDER_SHIPPED: { label: "Shipped", icon: "📦", color: "text-blue-400" },
  ORDER_DELIVERED: { label: "Delivered", icon: "✅", color: "text-emerald-400" },
  ORDER_CANCELLED: { label: "Cancelled", icon: "❌", color: "text-rose-400" },
  INQUIRY_NEW: { label: "New Message", icon: "💬", color: "text-blue-400" },
  INQUIRY_REPLY: { label: "Reply", icon: "💬", color: "text-blue-400" },
  REVIEW_NEW: { label: "New Review", icon: "⭐", color: "text-amber-400" },
  LOW_STOCK: { label: "Low Stock", icon: "📦", color: "text-amber-400" },
  PAYOUT_SENT: { label: "Payout", icon: "🏦", color: "text-emerald-400" },
  SHOP_APPROVED: { label: "Shop Approved", icon: "🎉", color: "text-emerald-400" },
  SHOP_SUSPENDED: { label: "Shop Suspended", icon: "⚠️", color: "text-rose-400" },
  SYSTEM: { label: "System", icon: "🔔", color: "text-zinc-400" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const unreadOnly = filter === "unread" ? "true" : "false";
      const res = await fetch(
        `${API_URL}/api/v1/notifications?take=${pageSize}&skip=${page * pageSize}&unreadOnly=${unreadOnly}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setTotal(data.total ?? 0);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const csrf = await getCsrfToken();
      await fetch(`${API_URL}/api/v1/notifications/mark-read`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
        body: JSON.stringify({ notificationIds }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id) ? { ...n, read: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const csrf = await getCsrfToken();
      await fetch(`${API_URL}/api/v1/notifications/mark-all-read`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const csrf = await getCsrfToken();
      await fetch(`${API_URL}/api/v1/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRF-Token": csrf },
      });
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => prev - 1);
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const deleteAllRead = async () => {
    try {
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_URL}/api/v1/notifications`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRF-Token": csrf },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications((prev) => prev.filter((n) => !n.read));
        setTotal((prev) => prev - (data.deleted ?? 0));
      }
    } catch (err) {
      console.error("Failed to delete read notifications:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-400" /> Notifications
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as "all" | "unread");
              setPage(0);
            }}
            className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
          >
            <option value="all">All notifications</option>
            <option value="unread">Unread only</option>
          </select>
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500/20 border border-blue-500/40 px-3 py-1.5 text-sm text-blue-300 hover:bg-blue-500/30"
            >
              <CheckCheck className="h-4 w-4" /> Mark all as read
            </button>
          )}
          <button
            onClick={deleteAllRead}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-500/20 border border-rose-500/40 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/30"
          >
            <Trash2 className="h-4 w-4" /> Clear read
          </button>
        </div>
      )}

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-12 text-center">
          <Bell className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">No notifications</h3>
          <p className="text-sm text-zinc-500 mt-1">
            {filter === "unread" ? "You've read all your notifications" : "You don't have any notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const typeInfo = typeLabels[notification.type] ?? typeLabels.SYSTEM;
            return (
              <div
                key={notification.id}
                className={`group relative rounded-xl border p-4 transition-all ${
                  notification.read
                    ? "border-white/10 bg-black/20"
                    : "border-blue-500/30 bg-blue-500/10"
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 text-2xl">{typeInfo.icon}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className={`text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <h3 className="text-white font-medium mt-0.5">{notification.title}</h3>
                        <p className="text-sm text-zinc-400 mt-1">{notification.message}</p>
                        <p className="text-xs text-zinc-500 mt-2">{formatDate(notification.createdAt)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead([notification.id])}
                            className="p-2 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-white/10 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Link */}
                    {notification.link && (
                      <Link
                        href={notification.link}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead([notification.id]);
                          }
                        }}
                        className="inline-flex items-center gap-1 mt-3 text-sm text-blue-400 hover:text-blue-300"
                      >
                        View details →
                      </Link>
                    )}
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
