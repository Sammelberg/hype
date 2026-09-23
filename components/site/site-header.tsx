import Link from "next/link";

export function SiteHeader({ siteName }: { siteName: string }) {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
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
