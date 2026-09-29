import type { Metadata } from "next";

import { getContactForm } from "@/cms/content/forms";
import { PageShell } from "../../_components/page-shell";
import { FormEditor } from "./_components/form-editor";

export const metadata: Metadata = { title: "Kontaktformular" };

export default async function FormPage() {
  const form = await getContactForm();
  if (!form) {
    return (
      <PageShell
        title="Kontaktformular"
        lead="Das Formular „Kontakt“ fehlt in der Datenbank; `pnpm seed` legt es an."
      >
        <p className="text-muted-foreground">
          Ohne Formular zeigt /kontakt nur die E-Mail-Adresse.
        </p>
      </PageShell>
    );
  }
  return <FormEditor key={form.updatedAt.getTime()} form={form} />;
}
