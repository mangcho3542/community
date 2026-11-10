"use client";
import Link from "@shared/ui/Link";
import {
  CircleUser,
  LucideHome,
  MessageCircleMore,
  Search,
} from "lucide-react";
import clsx from "clsx";
import { ElementType } from "react";
import Tooltip from "@shared/ui/Tooltip";

interface NavLink {
  href: string;
  icon: ElementType;
  content: string;
}

export default function Nav() {
  const navLinks: NavLink[] = [
    {
      href: "/",
      icon: LucideHome,
      content: "홈",
    },
    {
      href: "/explore",
      icon: Search,
      content: "게시물 검색",
    },
    {
      href: "/chat",
      icon: MessageCircleMore,
      content: "채팅",
    },
    {
      href: "/dashboard",
      icon: CircleUser,
      content: "프로필",
    },
  ];

  return (
    <nav
      className={clsx(
        "mt-auto h-fit w-full md:h-full md:w-fit",
        "fixed bottom-0 left-0",
      )}
    >
      <ul
        className={clsx(
          "h-fit w-full py-2 md:h-full md:w-fit md:px-2",
          "flex flex-row justify-center md:flex-col",
        )}
      >
        {navLinks.map((link) => (
            <Tooltip.Root key={link.content}
            position="right">
                <Tooltip.Trigger
                as="li"
                className="flex h-fit grow justify-center md:grow-0">
                    <Link href={link.href} className="hover-tint rounded-md p-1.5"
                    aria-label={link.content}
                    >
                        <link.icon />
                    </Link>
                </Tooltip.Trigger>

                <Tooltip.Positioner>
                    {link.content}
                </Tooltip.Positioner>
            </Tooltip.Root>
        ))}
      </ul>
    </nav>
  );
}
