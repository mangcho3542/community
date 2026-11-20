import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

export const metadata: Metadata = {
  title: "비스듬",
  description: "BDSM 커뮤니티",
};

const suit = localFont({
  src: [
    {
      path: "../../public/SUIT-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/SUIT-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/SUIT-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/SUIT-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={suit.className}>
      <body>
        {children}

        <div
          id="dialog-root"
          className="pointer-events-none fixed top-0 left-0 size-full"
        />

        <div
          id="toast-root"
          aria-live="polite"
          aria-label="알림"
          className="pointer-events-none fixed right-0 bottom-0 z-0 size-full"
        />

        <div
          id="tooltip-root"
          className="pointer-events-none fixed right-0 bottom-0 z-0 size-full"
        />
      </body>
    </html>
  );
}
