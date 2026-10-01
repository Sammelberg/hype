import { JsonLd } from "@/lib/seo";

type Question = { id?: string | null; question: string; answer: string };

// Questions and answers in the site's two-column rhythm: the heading on the left, stays in view
// while the answers pass on the right. Search engines read them as FAQPage (JSON-LD), matching
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
        <h2
          id={id}
          className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:sticky lg:top-[calc(var(--spacing-header)+2rem)] lg:self-start 3xl:text-5xl"
        >
          {title}
        </h2>
        <dl className="max-w-3xl">
          {items.map((item) => (
            <div
              key={item.id ?? item.question}
              className="border-t py-8 first:border-t-0 first:pt-0"
            >
              <dt className="text-xl font-medium tracking-tight text-balance 3xl:text-2xl">
                {item.question}
              </dt>
              <dd className="mt-3 text-lg text-pretty text-muted-foreground 3xl:text-xl">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
