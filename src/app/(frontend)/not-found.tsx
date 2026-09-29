import Link from "next/link";

import { PageHeader } from "@/components/site/page-header";

// Where a visitor who took a wrong turn most likely wanted to go.
const WAYS = [
  { href: "/", label: "Startseite" },
  { href: "/leistungen", label: "Leistungen" },
  { href: "/projekte", label: "Projekte" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/suche", label: "Suche" },
] as const;

export default function NotFound() {
  return (
    <main>
      <PageHeader
        title="Seite nicht gefunden"
        lead="Die angeforderte Seite existiert nicht oder wurde verschoben."
        horizonKey="404"
      />
      <nav aria-labelledby="wege-titel" className="page-container py-16 sm:py-24">
        <h2 id="wege-titel" className="text-xl font-medium tracking-tight">
          Von hier aus weiter
        </h2>
        <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-lg">
          {WAYS.map((way) => (
            <li key={way.href}>
              <Link
                href={way.href}
                className="underline decoration-primary-soft underline-offset-4 transition-colors hover:text-primary-soft"
              >
                {way.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
