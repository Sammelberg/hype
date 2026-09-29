import Link from "next/link";

import { Button } from "@/components/ui/button";

// The invitation that ends the home page and the content pages: one sentence, one action.
export function ClosingCta() {
  return (
    <section aria-labelledby="anfrage-titel" className="border-t">
      <div className="page-container flex flex-col items-start gap-8 py-20 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h2
            id="anfrage-titel"
            className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl 3xl:text-6xl"
          >
            Erzählen Sie uns von Ihrem Vorhaben.
          </h2>
          <p className="mt-4 text-lg text-pretty text-muted-foreground 3xl:text-xl">
            Wir melden uns mit einer ersten Einschätzung und einem Vorschlag für das weitere
            Vorgehen.
          </p>
        </div>
        <Button asChild size="lg" variant="outline">
          <Link href="/kontakt">Projekt anfragen</Link>
        </Button>
      </div>
    </section>
  );
}
