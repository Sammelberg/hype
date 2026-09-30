import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/data/queries";

// The invitation that ends the home page and the content pages: one sentence, one action.
// Its text is edited under /admin → Website → Abschluss „Anfrage“.
export async function ClosingCta() {
  const { cta } = await getSiteSettings();
  if (!cta?.title) return null;

  return (
    <section aria-labelledby="anfrage-titel" className="border-t" data-cms-zone="anfrage">
      <div className="page-container flex flex-col items-start gap-8 py-20 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h2
            id="anfrage-titel"
            className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl 3xl:text-6xl"
          >
            {cta.title}
          </h2>
          {cta.text ? (
            <p className="mt-4 text-lg text-pretty text-muted-foreground 3xl:text-xl">{cta.text}</p>
          ) : null}
        </div>
        <Button asChild size="lg" variant="outline">
          <Link href="/kontakt">{cta.label}</Link>
        </Button>
      </div>
    </section>
  );
}
