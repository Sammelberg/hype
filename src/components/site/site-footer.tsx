import { Verweis } from "@/components/site/verweis";

import type { NavSection } from "@/lib/site-nav";

import { Wortmarke } from "./wortmarke";

type Social = { label: string; url: string; id?: string | null };

const LISTE =
  "inline-block py-1.5 text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";
const KLEIN =
  "inline-flex min-h-11 items-center text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";

/**
 * The site's foot: the name and tagline, the contact address, every page of the site in balanced
 * columns, then the legal line (Impressum, Datenschutz, Suche, profiles).
 */
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
    <footer data-cms-zone="fuss" className="border-t bg-muted/30">
      <div className="page-container grid gap-12 py-16 lg:grid-cols-12 lg:gap-16">
        <div className="flex flex-col items-start gap-4 lg:col-span-5">
          <Wortmarke siteName={siteName} />
          {tagline ? <p className="max-w-sm text-pretty text-muted-foreground">{tagline}</p> : null}
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="underline underline-offset-4 hover:text-muted-foreground"
            >
              {contactEmail}
            </a>
          ) : null}
        </div>

        {/* Every section with the pages below it, in balanced columns so a section without pages
            leaves no hole. */}
        <div className="columns-2 gap-x-8 sm:columns-3 lg:col-span-7">
          {sections.map((section) => (
            <nav key={section.href} aria-label={section.label} className="mb-8 break-inside-avoid">
              <Verweis
                href={section.href as never}
                className="inline-block py-1 text-sm font-medium underline-offset-4 hover:underline"
              >
                {section.label}
              </Verweis>
              {section.children.length > 0 ? (
                <ul className="mt-1">
                  {section.children.map((link) => (
                    <li key={link.href}>
                      <Verweis href={link.href as never} className={LISTE}>
                        {link.label}
                      </Verweis>
                    </li>
                  ))}
                </ul>
              ) : null}
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t">
        <div className="page-container flex flex-col gap-1 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} {ownerName}
          </p>
          <ul className="flex flex-wrap gap-x-6">
            <li>
              <Verweis href={"/impressum" as never} className={KLEIN}>
                Impressum
              </Verweis>
            </li>
            <li>
              <Verweis href={"/datenschutz" as never} className={KLEIN}>
                Datenschutz
              </Verweis>
            </li>
            <li>
              <Verweis href="/suche" className={KLEIN}>
                Suche
              </Verweis>
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
    </footer>
  );
}
