import { JsonLd } from "@/lib/seo";

type Question = { id?: string | null; question: string; answer: string };

// Questions and answers, each opening its answer in place (the first one open). Search engines
// read them as FAQPage (JSON-LD), matching what is visible word for word.
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
    <section aria-labelledby={id} className="border-t" data-cms-zone={zone}>
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
      <div className="page-container py-16 sm:py-24">
        <h2 id={id} className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {title}
        </h2>
        <div className="mt-8 max-w-3xl divide-y border-y">
          {items.map((item, i) => (
            <details key={item.id ?? item.question} name={`${id}-antworten`} open={i === 0}>
              <summary className="flex min-h-11 cursor-pointer items-center py-4 text-lg font-medium">
                {item.question}
              </summary>
              <p className="pb-6 text-pretty text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
