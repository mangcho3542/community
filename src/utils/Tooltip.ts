"use client";
import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useRef,
  useState,
} from "react";

export type TooltipPosition = "top" | "right" | "bottom" | "left";

export interface TooltipI {
  trigger: RefObject<HTMLElement | null>;
  openDelay: number;
  closeDelay: number;
  position: TooltipPosition;
  gap: number;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export interface UseTooltipProps {
  trigger?: RefObject<HTMLElement | null>;
  openDelay?: number;
  closeDelay?: number;
  position?: TooltipPosition;
  gap?: number;
}

export function useTooltip({
  trigger,
  openDelay = 350,
  closeDelay = 200,
  position = "bottom",
  gap = 8,
}: UseTooltipProps = {}): TooltipI {
  const ownTrigger = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  return {
    trigger: trigger ?? ownTrigger,
    openDelay,
    closeDelay,
    position,
    gap,
    open,
    setOpen,
  };
}
