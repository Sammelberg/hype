import Link from "next/link";

import { Faq } from "@/components/site/faq";
import type { LeistungSections as Sections, Projekt } from "@/cms/content/types";

import { Part } from "./part";

// The service's own sections, under its lead and text (/leistungen/*), in the parts' rhythm. Only
// the steps are numbered, because only they are a sequence. Every part leaves the page when the
// admin has left it empty.

export function LeistungSections({
  sections,
  projekt,
}: {
  sections: Sections;
  projekt: Projekt | null;
}) {
  const { fit, scope, steps, faq } = sections;
  return (
    <>
      {fit.length > 0 ? (
        <Part id="passt-titel" title={sections.fitTitle} zone="passt">
          {/* Situations side by side, set apart by a line above each, not boxed. */}
          <ul className="grid gap-x-12 gap-y-10 md:grid-cols-2 3xl:grid-cols-3">
            {fit.map((item) => (
              <li key={item.id ?? item.title} className="border-t border-primary-soft/40 pt-6">
                <h3 className="text-xl font-medium tracking-tight text-balance 3xl:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 text-lg text-pretty text-muted-foreground 3xl:text-xl">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </Part>
      ) : null}

      {scope.length > 0 ? (
        <Part id="umfang-titel" title={sections.scopeTitle} zone="umfang">
          <ul className="grid max-w-4xl gap-x-12 gap-y-4 text-lg text-pretty md:grid-cols-2 3xl:text-xl">
            {scope.map((item) => (
              <li key={item.id ?? item.text} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-[0.6em] size-1.5 shrink-0 rotate-45 bg-primary-soft"
                />
                {item.text}
              </li>
            ))}
          </ul>
        </Part>
      ) : null}

      {steps.length > 0 ? (
        <Part id="vorgehen-titel" title={sections.stepsTitle} zone="vorgehen">
          {/* The one drawn thing on the page: an ice line from step to step, like the ridge. */}
          <ol className="max-w-3xl">
            {steps.map((step, i) => (
              <li
                key={step.id ?? step.title}
                className="relative grid grid-cols-[3rem_minmax(0,1fr)] gap-x-6 pb-12 last:pb-0 sm:grid-cols-[3.5rem_minmax(0,1fr)]"
              >
                {i < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-12 bottom-0 left-6 w-px bg-primary-soft/40 sm:top-14 sm:left-7"
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className="grid size-12 place-items-center rounded-full border border-primary-soft/60 text-base font-medium text-primary-soft tabular-nums sm:size-14 sm:text-lg"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="pt-2.5 sm:pt-3.5">
                  <h3 className="text-xl font-medium tracking-tight text-balance 3xl:text-2xl">
                    <span className="sr-only">Schritt {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-3 text-lg text-pretty text-muted-foreground 3xl:text-xl">
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
            <p className="text-sm font-medium text-primary-soft">Aus unseren Projekten</p>
            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
              <div>
                <h2
                  id="projekt-titel"
                  className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl"
                >
                  {projekt.title}
                </h2>
                <p className="mt-3 text-lg text-muted-foreground">{projekt.kunde}</p>
              </div>
              <div className="max-w-3xl">
                <p className="text-xl text-pretty 3xl:text-2xl">{projekt.summary}</p>
                <Link
                  href={projekt.path as never}
                  className="mt-8 inline-flex text-lg font-medium text-primary-soft decoration-2 underline-offset-8 hover:underline"
                >
                  Zum Projekt<span className="sr-only">: {projekt.title}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
