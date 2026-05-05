"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle size={16} strokeWidth={1.5} style={{ color: "#4CAF50" }} />;
      case "error":
        return <AlertCircle size={16} strokeWidth={1.5} style={{ color: "#E57373" }} />;
      case "info":
        return <Info size={16} strokeWidth={1.5} style={{ color: "var(--brass)" }} />;
    }
  };

  const getBorder = (type: ToastType) => {
    switch (type) {
      case "success":
        return "rgba(76, 175, 80, 0.3)";
      case "error":
        return "rgba(229, 115, 115, 0.3)";
      case "info":
        return "rgba(168, 124, 62, 0.3)";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 12,
              background: "var(--obsidian)",
              border: `1px solid ${getBorder(toast.type)}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              color: "var(--bone)",
              fontSize: 13,
              fontFamily: "var(--font-manrope)",
              minWidth: 280,
              maxWidth: 400,
              animation: "slideUp 0.3s ease-out",
            }}
          >
            {getIcon(toast.type)}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--stone)",
                cursor: "pointer",
                padding: 2,
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
