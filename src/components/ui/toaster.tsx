"use client";

import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-lg border p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-right-full",
            toast.variant === "destructive"
              ? "border-red-200 bg-red-50 text-red-900"
              : toast.variant === "success"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-gray-200 bg-white text-gray-900"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className="text-sm font-semibold leading-none mb-1">{toast.title}</p>
              )}
              {toast.description && (
                <p className="text-sm text-gray-600">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
