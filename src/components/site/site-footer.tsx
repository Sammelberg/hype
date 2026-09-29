import Link from "next/link";

type Social = { label: string; url: string; id?: string | null };

export function SiteFooter({
  ownerName,
  contactEmail,
  socialLinks,
}: {
  ownerName: string;
  contactEmail?: string | null;
  socialLinks?: Social[] | null;
}) {
  return (
    <footer className="border-t text-sm text-muted-foreground">
      <div className="page-container py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {ownerName}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href="/kontakt" className="hover:text-foreground">
                Kontakt
              </Link>
            </li>
            {contactEmail ? (
              <li>
                <a href={`mailto:${contactEmail}`} className="hover:text-foreground">
                  E-Mail
                </a>
              </li>
            ) : null}
            {socialLinks?.map((s) => (
              <li key={s.id ?? s.url}>
                <a href={s.url} rel="me noopener" className="hover:text-foreground">
                  {s.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/suche" className="hover:text-foreground">
                Suche
              </Link>
            </li>
            <li>
              <Link href={"/impressum" as never} className="hover:text-foreground">
                Impressum
              </Link>
            </li>
            <li>
              <Link href={"/datenschutz" as never} className="hover:text-foreground">
                Datenschutz
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
