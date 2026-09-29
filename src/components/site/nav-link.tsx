"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// A header link that knows when its section is open: the page itself or any page below it.
// Links to a part of the home page (/#vorgehen) never count as the current page.
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const current = !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href as never}
      aria-current={current ? "page" : undefined}
      className={cn(
        // 44px tall, so the links are easy to hit on touch screens.
        "relative inline-flex min-h-11 items-center text-muted-foreground transition-colors duration-150 hover:text-foreground",
        // A short ice line under the current section, like the rail under the services.
        current &&
          "text-foreground after:absolute after:inset-x-0 after:bottom-2 after:h-px after:bg-primary-soft",
      )}
    >
      {children}
    </Link>
  );
}
