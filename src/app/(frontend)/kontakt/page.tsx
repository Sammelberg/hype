import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { PageHeader } from "@/components/site/page-header";
import { RichText } from "@/components/site/rich-text";
import { getContactForm, getKontaktContent, getSiteSettings } from "@/data/queries";
import { buildMetadata } from "@/lib/seo";

import { ContactForm, type ContactFormField } from "./_components/contact-form";
import { freshStartToken } from "./_lib/start-token";

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getKontaktContent();
  return buildMetadata({
    meta: page?.meta,
    fallbackTitle: page?.title || "Kontakt",
    fallbackDescription: page?.lead || "Nehmen Sie über das Kontaktformular Kontakt auf.",
    path: "/kontakt",
  });
}

// The page „kontakt“ (/admin → Seiten → Kontakt): lead, SEO and the column beside the form. The
// form's fields are edited from there too (/admin/formular); saving them rebuilds this page.
export default async function ContactPage() {
  const [form, settings, { page, sections }, startToken] = await Promise.all([
    getContactForm(),
    getSiteSettings(),
    getKontaktContent(),
    freshStartToken(),
  ]);
  const fields = (form?.fields ?? []).filter((field) => "name" in field) as ContactFormField[];

  const email = settings.contactEmail;
  const next = { title: sections.nextTitle, text: sections.nextText ?? null };
  const mail = email ? (
    <a
      href={`mailto:${email}`}
      className="underline decoration-primary-soft underline-offset-4 transition-colors hover:text-primary-soft"
    >
      {email}
    </a>
  ) : null;

  return (
    <main>
      <PageHeader title={page?.title || "Kontakt"} lead={page?.lead} horizonKey="/kontakt" beacon />
      <div className="page-container grid gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16 3xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        {/* The form in one calm panel: the page's one job. */}
        <div
          className="max-w-4xl rise-later rounded-3xl border border-primary-soft/15 bg-card p-6 sm:p-10 lg:p-12"
          style={{ "--delay": "0.55s" } as CSSProperties}
          data-cms-zone="formular"
        >
          {form && fields.length ? (
            <ContactForm
              fields={fields}
              submitLabel={form.submitButtonLabel || "Absenden"}
              confirmation={<RichText data={form.confirmationMessage} className="prose-lg" />}
              contactEmail={email}
              startToken={startToken}
            />
          ) : (
            <p className="text-lg text-pretty text-muted-foreground">
              Das Kontaktformular ist gerade nicht verfügbar.
              {mail ? <> Sie erreichen uns per E-Mail an {mail}.</> : null}
            </p>
          )}
        </div>
        <aside
          aria-label="Weitere Wege"
          className="space-y-10 lg:sticky lg:top-[calc(var(--spacing-header)+2rem)] lg:self-start lg:pt-4"
          data-cms-zone="danach"
        >
          {mail ? (
            <div>
              <h2 className="text-xl font-medium tracking-tight">Lieber per E-Mail?</h2>
              <p className="mt-3 text-lg text-pretty text-muted-foreground">
                Schreiben Sie an {mail}.
              </p>
            </div>
          ) : null}
          {next?.title ? (
            <div className="relative pl-6">
              <span
                aria-hidden="true"
                className="absolute top-1.5 bottom-1 left-0 w-px bg-gradient-to-b from-primary-soft to-transparent"
              />
              <h2 className="text-xl font-medium tracking-tight">{next.title}</h2>
              <RichText data={next.text} className="prose-lg mt-3" />
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
