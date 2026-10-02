import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { FirLogo } from "./fir-mark";

/**
 * The logo as the link home: our drawn fir and the name, its last word quieter („Schwarzwald
 * Systems“). The header and the phone menu share it; the menu's sheet wraps it in its close.
 */
export function Wortmarke({
  siteName,
  short = false,
  className,
  ...props
}: {
  siteName: string;
  /** Between lg and xl the header's menus need the room: the name steps back to the fir alone. */
  short?: boolean;
} & Omit<ComponentProps<typeof Link>, "href">) {
  const cut = siteName.lastIndexOf(" ");
  return (
    <Link
      href="/"
      className={cn(
        "group/logo flex shrink-0 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      <FirLogo className="h-9 text-primary-soft transition-colors duration-300 group-hover/logo:text-foreground 3xl:h-10" />
      <span
        className={cn(
          "text-[1.0625rem] font-semibold tracking-[-0.02em] whitespace-nowrap 3xl:text-lg",
          short && "lg:max-xl:sr-only",
        )}
      >
        {cut > 0 ? (
          <>
            {siteName.slice(0, cut)}{" "}
            <span className="font-normal text-muted-foreground">{siteName.slice(cut + 1)}</span>
          </>
        ) : (
          siteName
        )}
      </span>
    </Link>
  );
}
