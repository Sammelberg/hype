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
        </ul>
      </nav>
    </header>
  );
}
