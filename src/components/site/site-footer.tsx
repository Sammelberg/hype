import Link from "next/link";

import { Kulissen } from "./landscape";
import { Wortmarke } from "./wortmarke";
import type { NavSection } from "@/lib/site-nav";

type Social = { label: string; url: string; id?: string | null };

const LISTE =
  "inline-block py-1.5 text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";
const KLEIN =
  "inline-flex min-h-11 items-center text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";

/**
 * The site's foot as a curtain (the owner's pick, 2026-10-02, after Winterhalder's foot): it lies
 * still beneath the page and is uncovered as the page lifts away from it. It says what we do,
 * where we sit, every page of the site, then the Black Forest as paper ridges of our three firs
 * („Kulissen“), parting as the page reaches its end, and the legal line.
 *
 * The curtain, only where the whole foot fits the viewport (wide and tall enough; elsewhere it
 * simply follows the page): a box clipped to itself holds the foot twice, once in the flow,
 * hidden and inert, so the box is exactly as tall as the foot, and once fixed to the bottom of
 * the viewport, which is the one seen through the box.
 */
export function SiteFooter(props: {
  sections: NavSection[];
  siteName: string;
  ownerName: string;
  tagline?: string | null;
  contactEmail?: string | null;
  socialLinks?: Social[] | null;
}) {
  return (
    <footer data-cms-zone="fuss" className="relative [clip-path:inset(0)]">
      <div className="[@media(min-width:64rem)_and_(min-height:52rem)]:fixed [@media(min-width:64rem)_and_(min-height:52rem)]:inset-x-0 [@media(min-width:64rem)_and_(min-height:52rem)]:bottom-0">
        <Fuss {...props} />
      </div>
      <div
        aria-hidden="true"
        inert
        className="invisible hidden [@media(min-width:64rem)_and_(min-height:52rem)]:block"
      >
        <Fuss {...props} />
      </div>
    </footer>
  );
}

function Fuss({
  sections,
  siteName,
  ownerName,
  tagline,
  contactEmail,
  socialLinks,
}: Parameters<typeof SiteFooter>[0]) {
  return (
    <div className="bg-background text-foreground">
      <div className="page-container grid gap-12 border-t pt-16 pb-10 sm:pt-20 lg:grid-cols-12 lg:gap-16">
        <div className="flex flex-col items-start gap-6 lg:col-span-5">
          <Wortmarke siteName={siteName} />
          {tagline ? (
            <p className="max-w-[16ch] text-[clamp(1.75rem,1.2rem+2vw,3rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance">
              {tagline}
            </p>
          ) : null}
          <p className="text-muted-foreground">
            Merianhof 5 · 79104 Freiburg im Breisgau
            {contactEmail ? (
              <>
                <br />
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-foreground underline decoration-primary-soft underline-offset-4 hover:text-primary-soft"
                >
                  {contactEmail}
                </a>
              </>
            ) : null}
          </p>
        </div>

        {/* Every section with the pages below it: the whole site at a glance, set in balanced
            columns so a section without pages leaves no hole. */}
        <div className="columns-2 gap-x-8 sm:columns-3 lg:col-span-7">
          {sections.map((section) => (
            <nav key={section.href} aria-label={section.label} className="mb-8 break-inside-avoid">
              <Link
                href={section.href as never}
                className="inline-block py-1 text-sm font-medium text-primary-soft underline-offset-4 hover:underline"
              >
                {section.label}
              </Link>
              {section.children.length > 0 ? (
                <ul className="mt-1">
                  {section.children.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href as never} className={LISTE}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </nav>
          ))}
        </div>
      </div>

      <Kulissen seed="fuss" place="fuss" />

      <div className="border-t bg-background">
        <div className="page-container flex flex-col gap-1 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} {ownerName}
          </p>
          <ul className="flex flex-wrap gap-x-6">
            <li>
              <Link href={"/impressum" as never} className={KLEIN}>
                Impressum
              </Link>
            </li>
            <li>
              <Link href={"/datenschutz" as never} className={KLEIN}>
                Datenschutz
              </Link>
            </li>
            <li>
              <Link href="/suche" className={KLEIN}>
                Suche
              </Link>
            </li>
            {socialLinks?.map((s) => (
              <li key={s.id ?? s.url}>
                <a href={s.url} rel="me noopener" className={KLEIN}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
