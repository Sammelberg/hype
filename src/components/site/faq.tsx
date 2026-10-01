import { JsonLd } from "@/lib/seo";

import styles from "./faq.module.css";

type Question = { id?: string | null; question: string; answer: string };

// Questions and answers in the site's two-column rhythm: the heading on the left, stays in view
// while the questions pass on the right, each opening its answer in place (the first one open). Search engines read them as FAQPage (JSON-LD), matching
// what is visible word for word. On /leistungen and on every service's page.
export function Faq({
  id,
  title,
  items,
  zone,
}: {
  id: string;
  title: string;
  items: readonly Question[];
  zone?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={id} className="bg-card" data-cms-zone={zone}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
      <div className="page-container grid gap-10 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        <div className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)] lg:self-start">
          <h2
            id={id}
            className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl 3xl:text-5xl"
          >
            {title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground tabular-nums">
            {items.length === 1 ? "Eine Frage" : `${items.length} Fragen`}, kurz beantwortet.
          </p>
        </div>
        {/* One answer open at a time (the shared name); the height opens smoothly where the
            browser can animate to auto (faq.module.css). */}
        <div className="max-w-3xl border-b border-primary-soft/20">
          {items.map((item, i) => (
            <details
              key={item.id ?? item.question}
              name={`${id}-antworten`}
              className={styles.item}
              open={i === 0}
            >
              <summary className={styles.question}>
                <span className="text-xl font-medium tracking-tight text-balance 3xl:text-2xl">
                  {item.question}
                </span>
                <span aria-hidden="true" className={styles.sign} />
              </summary>
              <p className="pb-8 text-lg text-pretty text-muted-foreground 3xl:text-xl">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
