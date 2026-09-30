import Link from "next/link";

import { FirMark } from "./fir-mark";
import type { NavSection } from "@/lib/site-nav";

type Social = { label: string; url: string; id?: string | null };

const LINK = "transition-colors hover:text-foreground";

export function SiteFooter({
  sections,
  siteName,
  ownerName,
  tagline,
  contactEmail,
  socialLinks,
}: {
  sections: NavSection[];
  siteName: string;
  ownerName: string;
  tagline?: string | null;
  contactEmail?: string | null;
  socialLinks?: Social[] | null;
}) {
  return (
    <footer className="border-t text-muted-foreground" data-cms-zone="fuss">
      <div className="page-container grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16 xl:grid-cols-[minmax(0,1.5fr)_repeat(5,minmax(0,1fr))]">
        <div className="max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-foreground"
          >
            <FirMark className="size-6 text-primary-soft" />
            {siteName}
          </Link>
          {tagline ? <p className="mt-4 text-pretty">{tagline}</p> : null}
          <p className="mt-4">
            <Link href="/kontakt" className={`inline-block py-1 ${LINK}`}>
              Kontakt
            </Link>
          </p>
          {contactEmail ? (
            <p className="mt-1">
              <a
                href={`mailto:${contactEmail}`}
                className="text-foreground underline decoration-primary-soft underline-offset-4 transition-colors hover:text-primary-soft"
              >
                {contactEmail}
              </a>
            </p>
          ) : null}
        </div>

        {/* Every section with the pages below it: the whole site at a glance. Kontakt sits in the
            brand column beside the e-mail address. */}
        {sections
          .filter((section) => section.href !== "/kontakt")
          .map((section) => (
            <nav key={section.href} aria-label={section.label}>
              <Link
                href={section.href as never}
                className="text-sm font-medium text-primary-soft underline-offset-4 hover:underline"
              >
                {section.label}
              </Link>
              {section.children.length > 0 ? (
                <ul className="mt-4 space-y-1">
                  {section.children.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href as never} className={`inline-block py-1 ${LINK}`}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </nav>
          ))}

        <nav aria-labelledby="fuss-rechtliches">
          <h2 id="fuss-rechtliches" className="text-sm font-medium text-primary-soft">
            Rechtliches
          </h2>
          <ul className="mt-4 space-y-1">
            <li>
              <Link href={"/impressum" as never} className={`inline-block py-1 ${LINK}`}>
                Impressum
              </Link>
            </li>
            <li>
              <Link href={"/datenschutz" as never} className={`inline-block py-1 ${LINK}`}>
                Datenschutz
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t">
        <div className="page-container flex flex-col gap-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {ownerName}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href="/suche" className={`inline-block py-1 ${LINK}`}>
                Suche
              </Link>
            </li>
            {socialLinks?.map((s) => (
              <li key={s.id ?? s.url}>
                <a href={s.url} rel="me noopener" className={`inline-block py-1 ${LINK}`}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
