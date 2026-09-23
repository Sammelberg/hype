import Link from "next/link";

export function SiteHeader({ siteName }: { siteName: string }) {
  return (
    <header className="page-container flex items-center justify-between py-fib-md">
      <Link href="/" className="font-medium tracking-tight">
        {siteName}
      </Link>
      <nav aria-label="Hauptnavigation">
        <ul className="flex gap-6 text-sm text-muted-foreground">
          <li>
            <Link href="/#projekte" className="hover:text-foreground">
              Projekte
            </Link>
          </li>
          <li>
            <Link href="/kontakt" className="hover:text-foreground">
              Kontakt
            </Link>
          </li>
          <li>
            <Link href="/suche" className="hover:text-foreground">
              Suche
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
