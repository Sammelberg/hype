import type { Metadata } from "next";

import { PageHeader } from "@/components/site/page-header";
import { RichText } from "@/components/site/rich-text";
import { getContactForm, getSiteSettings } from "@/data/queries";
import { buildMetadata } from "@/lib/seo";

import { ContactForm, type ContactFormField } from "./_components/contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata({
    fallbackTitle: "Kontakt",
    fallbackDescription: settings.kontaktLead || "Nehmen Sie über das Kontaktformular Kontakt auf.",
    path: "/kontakt",
  });
}

// Fallback start time for visitors without JavaScript (the page is static, so this is build time;
// the form replaces it with the mount time). Without it their messages would count as spam.
const RENDERED_AT = Date.now();

// The form itself is edited in the admin (Formulare → „Kontakt“); publishing it rebuilds this page.
export default async function ContactPage() {
  const [form, settings] = await Promise.all([getContactForm(), getSiteSettings()]);
  const fields = (form?.fields ?? []).filter((field) => "name" in field) as ContactFormField[];

  const email = settings.contactEmail;
  const next = settings.kontaktNext;
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
      <PageHeader title="Kontakt" lead={settings.kontaktLead} horizonKey="/kontakt" />
      <div className="page-container grid gap-16 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-24 3xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="max-w-3xl">
          {form && fields.length ? (
            <ContactForm
              fields={fields}
              submitLabel={form.submitButtonLabel || "Absenden"}
              confirmation={<RichText data={form.confirmationMessage} className="prose-lg" />}
              contactEmail={email}
              renderedAt={RENDERED_AT}
            />
          ) : (
            <p className="text-lg text-pretty text-muted-foreground">
              Das Kontaktformular ist gerade nicht verfügbar.
              {mail ? <> Sie erreichen uns per E-Mail an {mail}.</> : null}
            </p>
          )}
        </div>
        <aside aria-label="Weitere Wege" className="space-y-10 lg:border-l lg:pl-12">
          {mail ? (
            <div>
              <h2 className="text-xl font-medium tracking-tight">Lieber per E-Mail?</h2>
              <p className="mt-3 text-lg text-pretty text-muted-foreground">
                Schreiben Sie an {mail}.
              </p>
            </div>
          ) : null}
          {next?.title ? (
            <div>
              <h2 className="text-xl font-medium tracking-tight">{next.title}</h2>
              <RichText data={next.text} className="prose-lg mt-3" />
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
