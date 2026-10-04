import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/cms/auth/guard";
import { getDarsteller, listFiguren } from "@/buchung/daten/stammdaten";
import { DarstellerEditor } from "../_components/darsteller-editor";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id);
  const person = Number.isInteger(id) ? await getDarsteller(id) : null;
  return { title: person?.name ?? "Darsteller" };
}

export default async function DarstellerSeite({ params }: Props) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [person, figuren] = await Promise.all([getDarsteller(id), listFiguren()]);
  if (!person) notFound();
  return (
    <DarstellerEditor
      key={JSON.stringify(person)}
      id={id}
      darsteller={person}
      figuren={figuren.map((f) => ({ id: f.id, name: f.name }))}
    />
  );
}
