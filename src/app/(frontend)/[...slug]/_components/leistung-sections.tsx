import Link from "next/link";
import type { CSSProperties } from "react";

import { Faq } from "@/components/site/faq";
import { Part } from "@/components/site/part";
import { type GlyphName, ServiceGlyph } from "@/components/site/service-glyphs";
import { Spotlight } from "@/components/site/spotlight";
import type { LeistungSections as Sections, Projekt } from "@/cms/content/types";

import styles from "./leistung-sections.module.css";

type Other = { id?: string | null; slug: string; title: string; text: string; glyph: GlyphName };

// The service's own sections, under its lead and text (/leistungen/*), in the parts' rhythm, each
// with the one movement that fits it: the situations lit where the mouse is, the checks drawn as
// the list comes in, a trail through the steps that fills as they are read, the project as a
// framed card, the other services at the end. Only the steps are numbered, because only they are
// a sequence. Every part leaves the page when the admin has left it empty.

export function LeistungSections({
  sections,
  projekt,
  others,
}: {
  sections: Sections;
  projekt: Projekt | null;
  others: readonly Other[];
}) {
  const { fit, scope, steps, faq } = sections;
  return (
    <>
      {fit.length > 0 ? (
        <Part id="passt-titel" title={sections.fitTitle} zone="passt">
          <ul className="grid sd-stagger gap-4 md:grid-cols-2 3xl:grid-cols-3">
            {fit.map((item, i) => (
              <li key={item.id ?? item.title} style={{ "--i": i } as CSSProperties}>
                <Spotlight className="h-full rounded-2xl border border-primary-soft/15 bg-card p-7 sm:p-8">
                  <h3 className="text-xl font-medium tracking-tight text-balance 3xl:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-lg text-pretty text-muted-foreground 3xl:text-xl">
                    {item.text}
                  </p>
                </Spotlight>
              </li>
            ))}
          </ul>
        </Part>
      ) : null}

      {scope.length > 0 ? (
        <Part id="umfang-titel" title={sections.scopeTitle} zone="umfang">
          <ul className="grid max-w-4xl gap-x-12 text-lg text-pretty md:grid-cols-2 3xl:text-xl">
            {scope.map((item) => (
              <li
                key={item.id ?? item.text}
                className="flex gap-4 border-b border-primary-soft/15 py-5"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.check}>
                  <circle cx="12" cy="12" r="11" />
                  <path className="sd-stroke" d="M7 12.5l3.2 3.2L17 8.8" pathLength={1} />
                </svg>
                {item.text}
              </li>
            ))}
          </ul>
        </Part>
      ) : null}

      {steps.length > 0 ? (
        <Part id="vorgehen-titel" title={sections.stepsTitle} zone="vorgehen" line={false}>
          {/* A trail from step to step that fills as the steps are read; each waypoint lights
              when it reaches the middle of the screen (leistung-sections.module.css). */}
          <ol className={styles.trail}>
            {steps.map((step, i) => (
              <li key={step.id ?? step.title} className={styles.step}>
                <span aria-hidden="true" className={styles.waypoint}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="pt-2.5 sm:pt-3.5">
                  <h3 className="text-xl font-medium tracking-tight text-balance sm:text-2xl 3xl:text-3xl">
                    <span className="sr-only">Schritt {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-lg text-pretty text-muted-foreground 3xl:text-xl">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Part>
      ) : null}

      <Faq id="fragen-titel" title={sections.faqTitle} items={faq} zone="fragen" />

      {projekt ? (
        <section aria-labelledby="projekt-titel" className="border-t" data-cms-zone="projekt">
          <div className="page-container py-20 sm:py-28">
            <Spotlight className="sd-settle rounded-3xl border border-primary-soft/20 bg-card">
              <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16 lg:p-16">
                <div>
                  <p className="text-base font-medium text-primary-soft">Aus unseren Projekten</p>
                  <h2
                    id="projekt-titel"
                    className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-5xl 3xl:text-6xl"
                  >
                    {projekt.title}
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">{projekt.kunde}</p>
                </div>
                <div className="flex flex-col justify-between gap-10">
                  <p className="text-xl text-pretty sm:text-2xl 3xl:text-3xl">{projekt.summary}</p>
                  <Link
                    href={projekt.path as never}
                    className="group inline-flex items-center gap-3 self-start text-lg font-medium text-primary-soft after:absolute after:inset-0 after:content-['']"
                  >
                    <span className="decoration-2 underline-offset-8 group-hover:underline">
                      Zum Projekt<span className="sr-only">: {projekt.title}</span>
                    </span>
                    <Arrow />
                  </Link>
                </div>
              </div>
            </Spotlight>
          </div>
        </section>
      ) : null}

      {others.length > 0 ? (
        <nav aria-labelledby="weitere-leistungen" className="border-t">
          <div className="page-container py-20 sm:py-24">
            <h2
              id="weitere-leistungen"
              className="text-2xl font-semibold tracking-tight sm:text-3xl 3xl:text-4xl"
            >
              Weitere Leistungen
            </h2>
            <ul className="mt-10 grid sd-stagger gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {others.map((other, i) => (
                <li key={other.id ?? other.slug} style={{ "--i": i } as CSSProperties}>
                  <Spotlight className="group h-full rounded-2xl border border-primary-soft/15 bg-card transition-colors hover:border-primary-soft/40">
                    <Link
                      href={`/leistungen/${other.slug}` as never}
                      className="flex h-full flex-col gap-6 p-7 outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-ring"
                    >
                      <ServiceGlyph
                        name={other.glyph}
                        className="size-11 text-primary-soft transition-transform duration-300 ease-out group-hover:-translate-y-1"
                      />
                      <span className="text-xl font-medium tracking-tight text-balance">
                        {other.title}
                      </span>
                      <span className="line-clamp-3 text-base text-pretty text-muted-foreground">
                        {other.text}
                      </span>
                      <span className="mt-auto text-primary-soft" aria-hidden="true">
                        <Arrow />
                      </span>
                    </Link>
                  </Spotlight>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      ) : null}
    </>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 28 28"
      aria-hidden="true"
      className="size-5 fill-none stroke-current stroke-2 transition-transform duration-200 ease-out [stroke-linecap:round] [stroke-linejoin:round] group-hover:translate-x-1"
    >
      <path d="M5 14h17M16 8l6 6-6 6" />
    </svg>
  );
}
