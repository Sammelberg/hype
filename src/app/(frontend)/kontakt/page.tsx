import type { Metadata } from "next";

import { ContactForm, type ContactFormField } from "./_components/contact-form";
import { RichText } from "@/components/site/rich-text";
import { getContactForm, getSiteSettings } from "@/data/queries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    fallbackTitle: "Kontakt",
    fallbackDescription: "Schreiben Sie mir über das Kontaktformular.",
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

  return (
    <main className="page-container max-w-3xl pt-section">
      <h1 className="text-4xl font-semibold tracking-tight text-balance">Kontakt</h1>
      {form && fields.length ? (
        <div className="mt-fib-xl">
          <ContactForm
            fields={fields}
            submitLabel={form.submitButtonLabel || "Absenden"}
            confirmation={<RichText data={form.confirmationMessage} className="max-w-prose" />}
            contactEmail={settings.contactEmail}
            renderedAt={RENDERED_AT}
          />
        </div>
      ) : (
        <p className="mt-fib-lg text-pretty text-muted-foreground">
          Das Kontaktformular ist gerade nicht verfügbar.
          {settings.contactEmail ? (
            <>
              {" "}
              Sie erreichen mich per E-Mail an{" "}
              <a href={`mailto:${settings.contactEmail}`} className="underline underline-offset-4">
                {settings.contactEmail}
              </a>
              .
            </>
          ) : null}
        </p>
      )}
    </main>
  );
}
