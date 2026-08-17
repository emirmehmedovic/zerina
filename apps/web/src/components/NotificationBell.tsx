"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { Bell, Check, CheckCheck, Trash2, Loader2, X } from "lucide-react";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const typeIcons: Record<string, string> = {
  ORDER_NEW: "🛒",
  ORDER_PAID: "💰",
  INQUIRY_NEW: "💬",
  INQUIRY_REPLY: "💬",
  REVIEW_NEW: "⭐",
  LOW_STOCK: "📦",
  PAYOUT_SENT: "🏦",
  SHOP_APPROVED: "🎉",
  SYSTEM: "🔔",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/notifications?take=10`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/notifications/unread-count`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch (err) {
      // Silently fail for count updates
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

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
          notificationIds.includes(n.id) ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
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
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const csrf = await getCsrfToken();
      await fetch(`${API_URL}/api/v1/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRF-Token": csrf,
        },
      });
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
        afterLeave={() => setOpen(false)}
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden origin-top-right rounded-xl bg-zinc-900 border border-white/10 shadow-xl focus:outline-none z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[50vh]">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative group border-b border-white/5 last:border-0 ${
                    notification.read ? "bg-transparent" : "bg-blue-500/5"
                  }`}
                >
                  <Menu.Item>
                    {({ active }) => (
                      <div
                        className={`flex gap-3 px-4 py-3 ${
                          active ? "bg-white/5" : ""
                        }`}
                      >
                        {/* Icon */}
                        <div className="flex-shrink-0 text-lg">
                          {typeIcons[notification.type] ?? "🔔"}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {notification.link ? (
                            <Link
                              href={notification.link}
                              onClick={() => {
                                if (!notification.read) {
                                  markAsRead([notification.id]);
                                }
                              }}
                              className="block"
                            >
                              <div className="text-sm font-medium text-white truncate">
                                {notification.title}
                              </div>
                              <div className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                                {notification.message}
                              </div>
                              <div className="text-[10px] text-zinc-500 mt-1">
                                {formatTime(notification.createdAt)}
                              </div>
                            </Link>
                          ) : (
                            <div>
                              <div className="text-sm font-medium text-white truncate">
                                {notification.title}
                              </div>
                              <div className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                                {notification.message}
                              </div>
                              <div className="text-[10px] text-zinc-500 mt-1">
                                {formatTime(notification.createdAt)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                markAsRead([notification.id]);
                              }}
                              className="p-1 text-zinc-500 hover:text-emerald-400 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                      </div>
                    )}
                  </Menu.Item>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-4 py-2">
            <Link
              href="/dashboard/notifications"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              View all notifications
            </Link>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
