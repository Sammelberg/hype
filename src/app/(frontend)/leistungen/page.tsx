import type { Metadata } from "next";
import Link from "next/link";

import { ServiceGlyph } from "@/components/site/service-glyphs";
import { getSiteSettings } from "@/data/queries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    fallbackTitle: "Leistungen",
    fallbackDescription: "Was wir für den Mittelstand entwickeln, im Detail.",
    path: "/leistungen",
  });
}

export default async function LeistungenIndex() {
  const settings = await getSiteSettings();
  const services = settings.services ?? [];
  const faq = settings.faq ?? [];

  return (
    <main className="page-container max-w-3xl pt-16 sm:pt-24">
      <h1 className="text-4xl font-semibold tracking-tight text-balance">Leistungen</h1>
      <p className="mt-4 max-w-prose text-lg text-pretty text-muted-foreground">
        Von der einzelnen Schnittstelle bis zur kompletten Plattform – geplant für Ihre Abläufe,
        nicht für einen Standardfall.
      </p>

      {services.length > 0 ? (
        <ul className="mt-12 space-y-8">
          {services.map((service) => (
            <li key={service.id ?? service.slug} className="border-t pt-8">
              <Link
                href={`/leistungen/${service.slug}` as never}
                className="group flex items-start gap-4 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ServiceGlyph
                  name={service.glyph}
                  className="mt-1 size-8 shrink-0 text-primary-soft"
                />
                <span>
                  <span className="block text-2xl font-medium tracking-tight group-hover:text-primary-soft">
                    {service.title}
                  </span>
                  <span className="mt-2 block text-pretty text-muted-foreground">
                    {service.text}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {faq.length > 0 ? (
        <section aria-labelledby="faq-titel" className="mt-20 border-t pt-12">
          <h2 id="faq-titel" className="text-2xl font-medium tracking-tight">
            Häufige Fragen
          </h2>
          <dl className="mt-8 space-y-8">
            {faq.map((item) => (
              <div key={item.id ?? item.question}>
                <dt className="font-medium">{item.question}</dt>
                <dd className="mt-2 text-pretty text-muted-foreground">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </main>
  );
}
