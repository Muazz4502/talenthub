"use client";

import * as React from "react";

type ToastVariant = "default" | "destructive" | "success";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

type Action =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; id: string };

const toastReducer = (state: ToastState, action: Action): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return { toasts: [...state.toasts, action.toast] };
    case "REMOVE_TOAST":
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
};

let listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: Action) {
  memoryState = toastReducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function toast(props: Omit<Toast, "id">) {
  const id = Math.random().toString(36).substr(2, 9);
  const duration = props.duration ?? 4000;

  dispatch({ type: "ADD_TOAST", toast: { id, ...props } });

  setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", id });
  }, duration);

  return { id, dismiss: () => dispatch({ type: "REMOVE_TOAST", id }) };
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss: (id: string) => dispatch({ type: "REMOVE_TOAST", id }),
  };
}

export { useToast, toast };
export type { Toast, ToastVariant };
