import type { KatalogFigur } from "@/buchung/daten/katalog";
import { Reveal } from "@/components/motion/reveal";
import { StickyStage } from "@/components/motion/sticky-stage";
import { Worte } from "@/components/motion/worte";

import { FigurKarte } from "./figur-karte";
import { GalerieSzene } from "./galerie-szene";
import { Verweis } from "./verweis";

// The Figuren in one row that travels sideways while the section holds the screen (GalerieSzene);
// a strip to swipe where the scene does not run. The last card leads to the whole catalogue.
export function FigurenGalerie({
  titel,
  text,
  figuren,
}: {
  titel: string;
  text?: string;
  figuren: KatalogFigur[];
}) {
  if (figuren.length === 0) return null;
  return (
    <section aria-label={titel} className="border-y bg-card">
      <GalerieSzene>
        <StickyStage
          // A quarter screen of scroll per card keeps the row's pace near the page's.
          length={`${(figuren.length + 1) * 25}svh`}
          className="group/stage h-auto data-[szene]:h-[calc(100svh+var(--stage-length))]"
          stageClassName="static flex h-auto flex-col justify-center overflow-visible py-16 group-data-[szene]/stage:sticky group-data-[szene]/stage:py-0 group-data-[szene]/stage:pt-header sm:group-data-[szene]/stage:py-0 sm:group-data-[szene]/stage:pt-header group-data-[szene]/stage:h-svh group-data-[szene]/stage:overflow-hidden sm:py-24"
        >
          <div className="page-container">
            <Reveal>
              <Worte
                as="h2"
                text={titel}
                className="font-hand text-3xl font-semibold text-balance sm:text-5xl"
              />
            </Reveal>
            {text ? (
              <p className="mt-4 max-w-2xl text-lg text-pretty text-muted-foreground">{text}</p>
            ) : null}
          </div>
          <ul
            data-reihe=""
            className="mt-8 flex snap-x snap-mandatory scroll-px-gutter gap-4 overflow-x-auto px-gutter pb-2 group-data-[szene]/stage:snap-none group-data-[szene]/stage:overflow-visible sm:gap-6"
          >
            {figuren.map((figur, i) => (
              <li key={figur.id} className="w-[68vw] max-w-72 shrink-0 snap-start sm:w-64 lg:w-72">
                <FigurKarte
                  figur={figur}
                  sizes="(min-width: 640px) 18rem, 68vw"
                  className={i % 2 ? "sm:translate-y-6" : undefined}
                />
              </li>
            ))}
            <li className="w-[68vw] max-w-72 shrink-0 snap-start sm:w-64 lg:w-72">
              <Verweis
                href={"/figuren" as never}
                className="grid aspect-4/5 place-items-center rounded-3xl border-2 border-dashed border-foreground/30 p-6 text-center font-hand text-2xl font-semibold hover:border-foreground/60"
              >
                Alle {figuren.length} Figuren ansehen
              </Verweis>
            </li>
          </ul>
        </StickyStage>
      </GalerieSzene>
    </section>
  );
}
