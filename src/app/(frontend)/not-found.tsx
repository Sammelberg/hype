import Link from "next/link";

import { PageHeader } from "@/components/site/page-header";

// Where a visitor who took a wrong turn most likely wanted to go.
const WAYS = [
  { href: "/", label: "Startseite" },
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
      />
      <nav aria-labelledby="wege-titel" className="page-container py-16 sm:py-24">
        <h2 id="wege-titel" className="text-2xl font-semibold tracking-tight">
          Von hier aus weiter
        </h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {WAYS.map((way) => (
            <li key={way.href}>
              <Link
                href={way.href}
                className="inline-flex min-h-11 items-center rounded-full border px-5 transition-colors hover:bg-muted"
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
