import Link from "next/link";
import type { ComponentProps } from "react";

// The site's link: Next's <Link> without prefetching when it scrolls into view (it still loads
// the page on hover or touch). On a long page every visible link fetched its page in the
// background, dozens of requests during the scroll (winterhalder: up to 1 MB per page). ESLint
// sends the site's code here instead of next/link. `prefetch` can still be set for a link that
// is all but certain to be followed.
export function Verweis({ prefetch = false, ...props }: ComponentProps<typeof Link>) {
  return <Link prefetch={prefetch} {...props} />;
}
