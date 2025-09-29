"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = {
  id: string;
  title?: string;
  message: string;
  type?: "success" | "error" | "info";
  timeoutMs?: number;
};

type ToastContextValue = {
  push: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, timeoutMs: 3000, type: "info", ...t };
    setToasts((prev) => [...prev, toast]);
    const ms = toast.timeoutMs ?? 3000;
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, ms);
  }, []);

  const ctx = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed z-50 bottom-4 right-4 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`card-base card-glass border ${
              t.type === "success"
                ? "border-emerald-400/50"
                : t.type === "error"
                ? "border-rose-400/50"
                : "border-light-glass-border"
            }`}
          >
            {t.title && <div className="font-semibold mb-1">{t.title}</div>}
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
