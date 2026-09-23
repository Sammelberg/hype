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
    <footer className="page-container mt-section border-t border-border py-fib-lg text-sm text-muted-foreground">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {ownerName}
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {contactEmail ? (
            <li>
              <a href={`mailto:${contactEmail}`} className="hover:text-foreground">
                Kontakt
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
    </footer>
  );
}
