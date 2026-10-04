import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getSiteSettings } from "@/data/queries";

// The invitation that ends the home page and the content pages: one sentence, one action. Its
// text is edited under /admin → Website → Abschluss „Anfrage“.
export async function ClosingCta() {
  const { cta } = await getSiteSettings();
  if (!cta?.title) return null;

  return (
    <section aria-labelledby="anfrage-titel" className="border-t" data-cms-zone="anfrage">
      <div className="page-container py-20 sm:py-28">
        <h2
          id="anfrage-titel"
          className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
        >
          {cta.title}
        </h2>
        {cta.text ? (
          <p className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">{cta.text}</p>
        ) : null}
        {cta.label ? (
          <Link href="/kontakt" className={buttonVariants({ size: "lg", className: "mt-8" })}>
            {cta.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
