import Link from "next/link";

import { FirMark } from "./fir-mark";
import { SITE_GROUPS } from "./menu-links";

type Social = { label: string; url: string; id?: string | null };

const LINK = "transition-colors hover:text-foreground";

export function SiteFooter({
  siteName,
  ownerName,
  tagline,
  contactEmail,
  socialLinks,
}: {
  siteName: string;
  ownerName: string;
  tagline?: string | null;
  contactEmail?: string | null;
  socialLinks?: Social[] | null;
}) {
  return (
    <footer className="border-t text-muted-foreground">
      <div className="page-container grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] lg:gap-16">
        <div className="max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-foreground"
          >
            <FirMark className="size-6 text-primary-soft" />
            {siteName}
          </Link>
          {tagline ? <p className="mt-4 text-pretty">{tagline}</p> : null}
          {contactEmail ? (
            <p className="mt-4">
              <a
                href={`mailto:${contactEmail}`}
                className="text-foreground underline decoration-primary-soft underline-offset-4 transition-colors hover:text-primary-soft"
              >
                {contactEmail}
              </a>
            </p>
          ) : null}
        </div>

        {SITE_GROUPS.map((group) => (
          <nav key={group.label} aria-labelledby={`fuss-${group.label}`}>
            <h2 id={`fuss-${group.label}`} className="text-sm font-medium text-primary-soft">
              {group.label}
            </h2>
            <ul className="mt-4 space-y-1">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href as never} className={`inline-block py-1 ${LINK}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
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
