"use client";
import Link from "@shared/ui/Link";
import Tooltip from "@shared/ui/Tooltip";
import { BookSearch, Bell } from "lucide-react";
import { ElementType } from "react";

interface HeaderLink {
  href: string;
  icon: ElementType;
  content: string;
}

export default function Header() {
  const headerLinks: HeaderLink[] = [
    {
      href: "/guide",
      icon: BookSearch,
      content: "가이드",
    },
    {
      href: "/notification",
      icon: Bell,
      content: "알림",
    },
  ];

  return (
    <header className="mb-1 flex h-fit w-full items-center pt-3 pr-2 pb-1 pl-0.5 md:mx-auto md:w-xl">
      <Link
        href="/"
        underline={false}
        className="hover-tint h-full rounded-sm p-1.5 text-lg font-bold"
      >
        BSDM
      </Link>

      <div className="ml-auto flex h-full w-fit items-center gap-1">
        {headerLinks.map((link) => (
          <Tooltip.Root key={link.content}>
            <Tooltip.Trigger
              href={link.href}
              as={Link}
              key={link.content}
              className="hover-tint size-fit rounded-md p-1.5"
              aria-label={link.content}
            >
              <link.icon />
            </Tooltip.Trigger>

            <Tooltip.Positioner>{link.content}</Tooltip.Positioner>
          </Tooltip.Root>
        ))}
      </div>
    </header>
  );
}
