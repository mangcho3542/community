"use client";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children?: ReactNode;
  containerId?: string;
}

export function Portal({ children, containerId }: PortalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return createPortal(
    children,
    containerId
      ? (document.getElementById(containerId) ?? document.body)
      : document.body,
  );
}
