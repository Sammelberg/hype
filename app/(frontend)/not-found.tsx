import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-sm text-muted-foreground tabular-nums">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Seite nicht gefunden</h1>
      <p className="mt-4 text-pretty text-muted-foreground">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link href="/" className="mt-8 inline-block underline underline-offset-4">
        Zur Startseite
      </Link>
    </main>
  );
}
