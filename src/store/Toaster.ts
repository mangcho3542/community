"use client";
import { useState, type ReactNode } from "react";
import { createStore, useStore } from "zustand";

export type PlacementT =
  "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end";

export interface ToastI {
  title?: ReactNode;
  description?: ReactNode;
  type?: "success" | "error" | "warning" | "info";
  duration: number;
  id: string;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface ToasterMethodProps extends Pick<
  ToastI,
  "title" | "description" | "type"
> {
  duration?: number;
}

interface ToasterState {
  toasts: ToastI[];
  length: number;
  placement: PlacementT;
  gap: number;
  create: (props: ToasterMethodProps) => string;
  dismiss: (id: string) => void;
}

let count = 0;

interface UseToasterPropsI extends Partial<
  Pick<ToasterState, "placement" | "gap">
> {}

function createToaster(props?: UseToasterPropsI) {
  return createStore<ToasterState>((set, get) => ({
    toasts: [],
    placement: props?.placement ?? "bottom-end",
    gap: props?.gap ?? 16,
    length: 0,
    create({ title, description, type, duration = 3000 }) {
      const id = `toaster-${count++}`;
      const timeoutId = setTimeout(() => get().dismiss(id), duration);

      set((state) => ({
        toasts: [
          ...state.toasts,
          { title, description, type, duration, id, timeoutId },
        ],
        length: state.length + 1,
      }));
      return id;
    },
    dismiss(id) {
      const target = get().toasts.find((toast) => toast.id === id);
      if (!target) return;

      clearTimeout(target.timeoutId);
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
        length: state.length - 1,
      }));
    },
  }));
}

export function useToasterStore(props?: UseToasterPropsI) {
  // 첫 렌더에서만 store 생성. 이후 렌더는 같은 store 구독.
  const [store] = useState(() => createToaster(props));
  return useStore(store);
}
