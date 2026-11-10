"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn, tw } from "@shared/lib/class";
import { Portal } from "./Portal";
import Button from "./Button";
import { type ToastI, useToasterStore } from "@shared/lib/Toaster";

const typeClassName: Record<NonNullable<ToastI["type"]>, string> = {
  success: tw`bg-success`,
  error: tw`bg-danger`,
  warning: tw`bg-warning`,
  info: tw`bg-bg border border-solid border-border-primary`,
};

interface ToastProps {
  toaster: ReturnType<typeof useToasterStore>;
}

function Toast({ toaster }: ToastProps) {
  const { toasts, placement, gap } = toaster;
  const isTop = placement.startsWith("top");
  // 화면 가장자리 쪽으로 자기 높이의 절반만큼 밀린 상태에서 등장한다.
  const y = isTop ? "-50%" : "50%";

  return (
    <Portal containerId="toast-root">
      {/* 쌓는 위치는 flex와 gap이 정한다. 새 Toast는 항상 가장자리 쪽에 붙는다. */}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 flex justify-end p-4",
          isTop ? "flex-col-reverse" : "flex-col",
          placement.endsWith("start") ? "items-start" : "items-end",
        )}
        style={{ gap }}
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(({ id, title, description, type = "info" }) => (
            <motion.div
              key={id}
              layout="position"
              initial={{ opacity: 0, y }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y }}
              transition={{ ease: "easeInOut", duration: 0.25 }}
              className={cn(
                "text-fg pointer-events-auto relative z-100 flex min-w-xs flex-col",
                "gap-1 rounded-lg py-4 pr-10 pl-4 justify-center",
                typeClassName[type],
              )}
            >
              <div className="z-1 size-fit font-semibold">{title}</div>
              <div className="z-1 size-fit text-sm">{description}</div>
              <Button
                className="absolute top-1 right-1 z-2 inline-flex items-center justify-center"
                onClick={() => toaster.dismiss(id)}
                aria-label="Close Toast"
              >
                <X className="size-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Portal>
  );
}

export { useToasterStore as useToaster, Toast };
