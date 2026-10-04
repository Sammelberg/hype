import { Verweis } from "@/components/site/verweis";

import { EinladungsKarte } from "@/components/site/einladungs-karte";
import { buttonVariants } from "@/components/ui/button";
import { getSiteSettings } from "@/data/queries";

// The invitation that ends the home page and the content pages: one sentence, one action, on the
// site's invitation card; it leads to the booking. Its text is edited under /admin → Website →
// Abschluss „Anfrage“.
export async function ClosingCta() {
  const { cta } = await getSiteSettings();
  if (!cta?.title) return null;

  return (
    <section aria-labelledby="anfrage-titel" className="border-t" data-cms-zone="anfrage">
      <div className="page-container py-16 sm:py-24">
        <EinladungsKarte className="mx-auto max-w-3xl sm:rotate-1">
          <div className="py-4 text-center sm:py-8">
            <h2
              id="anfrage-titel"
              className="mx-auto max-w-2xl font-hand text-3xl font-semibold text-balance sm:text-5xl"
            >
              {cta.title}
            </h2>
            {cta.text ? (
              <p className="mx-auto mt-4 max-w-xl text-lg text-pretty text-muted-foreground">
                {cta.text}
              </p>
            ) : null}
            {cta.label ? (
              <Verweis
                href={"/buchen" as never}
                className={buttonVariants({
                  size: "lg",
                  className: "mt-8 h-auto rounded-full px-8 py-3.5 text-base font-semibold",
                })}
              >
                {cta.label}
              </Verweis>
            ) : null}
          </div>
        </EinladungsKarte>
      </div>
    </section>
  );
}
