import { getSiteSettings } from "@/data/queries";

import styles from "./closing-cta.module.css";
import { InView } from "./in-view";
import { StarCta } from "./star-cta";
import { LitWords } from "./words";

// The invitation that ends the home page and the content pages: one sentence, one action. Its
// words light up as it is read; the footer's paper ridges follow right under it. Its text is
// edited under /admin → Website → Abschluss „Anfrage“.
export async function ClosingCta() {
  const { cta } = await getSiteSettings();
  if (!cta?.title) return null;

  return (
    <InView className="border-t">
      <section aria-labelledby="anfrage-titel" className={styles.cta} data-cms-zone="anfrage">
        <div className="page-container pt-24 pb-20 sm:pt-36 sm:pb-28 3xl:pt-44">
          <h2
            id="anfrage-titel"
            className="max-w-5xl text-[clamp(2.5rem,1.3rem+4.6vw,6rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance 3xl:max-w-6xl"
          >
            <LitWords text={cta.title} />
          </h2>
          <div className="mt-10 flex flex-col items-start gap-8 sm:mt-14 lg:flex-row lg:items-end lg:justify-between">
            {cta.text ? (
              <p className="max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl 3xl:text-2xl">
                {cta.text}
              </p>
            ) : null}
            {cta.label ? <StarCta label={cta.label} /> : null}
          </div>
        </div>
      </section>
    </InView>
  );
}
