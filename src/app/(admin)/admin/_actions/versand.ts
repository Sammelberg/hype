"use server";

import { writeAudit } from "@/cms/audit/log";
import { NotAllowed, requireRoleForAction } from "@/cms/auth/guard";
import { db } from "@/cms/db/client";
import { CmsError } from "@/cms/errors";
import { versendeRechnung } from "@/buero/daten/versand";

export type VersandErgebnis =
  { ok: true; to: string } | { ok: false; error: string; field?: string };

// An issued invoice by e-mail: a plain action, since the PDF arrives as a file in FormData.
// Admins only, like the whole office.
export async function rechnungVersendenAction(formData: FormData): Promise<VersandErgebnis> {
  let user;
  try {
    user = await requireRoleForAction("admin");
  } catch (error) {
    if (error instanceof NotAllowed || error instanceof CmsError)
      return { ok: false, error: error.message };
    throw error;
  }
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return { ok: false, error: "Die Rechnung gibt es nicht mehr." };
  const datei = formData.get("pdf");
  const pdf =
    datei instanceof File && datei.size > 0
      ? { name: datei.name, bytes: new Uint8Array(await datei.arrayBuffer()) }
      : null;
  try {
    const result = await versendeRechnung(
      {
        id,
        to: String(formData.get("to") ?? ""),
        subject: String(formData.get("subject") ?? ""),
        text: String(formData.get("text") ?? ""),
        xrechnung: formData.get("xrechnung") === "on",
        pdf,
      },
      { userId: user.id, autor: user.name || user.email },
    );
    await writeAudit(db, {
      actor: user,
      action: "rechnung.versendet",
      target: { type: "rechnung", id },
      details: { nummer: result.nummer, an: result.to, anhaenge: result.anhaenge },
    });
    return { ok: true, to: result.to };
  } catch (error) {
    if (error instanceof CmsError) return { ok: false, error: error.message, field: error.field };
    console.error("Rechnung nicht per E-Mail gesendet", error);
    return { ok: false, error: "Das hat nicht geklappt. Bitte versuchen Sie es noch einmal." };
  }
}
