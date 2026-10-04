import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { SiteMark } from "./site-mark";

/** The logo as the link home: the placeholder mark and the site's name. Header, menu and footer. */
export function Wortmarke({
  siteName,
  className,
  ...props
}: { siteName: string } & Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      href="/"
      className={cn(
        "flex shrink-0 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      <SiteMark name={siteName} />
      <span className="font-semibold tracking-tight whitespace-nowrap">{siteName}</span>
    </Link>
  );
}
