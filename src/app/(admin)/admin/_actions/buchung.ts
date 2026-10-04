"use server";

import { z } from "zod";

import { BuchungFehler } from "@/buchung/daten/basis";
import { halteSlot, sperreDarsteller } from "@/buchung/daten/belegung";
import { setzeStatus, speichereNotiz } from "@/buchung/daten/buchungen";
import { nachBestaetigung, nachNeuerBuchung, nachStorno } from "@/lib/buchung-ereignisse";
import {
  loescheDarsteller,
  loescheExtra,
  loescheFigur,
  loeschePaket,
  loescheStadt,
  loescheZone,
  speichereDarsteller,
  speichereEinstellungen,
  speichereExtra,
  speichereFigur,
  speicherePaket,
  speichereStadt,
  speichereZone,
} from "@/buchung/daten/stammdaten";
import {
  DarstellerSchema,
  EinstellungenSchema,
  ExtraSchema,
  FigurSchema,
  ManuelleBuchungSchema,
  PaketSchema,
  SperreSchema,
  StadtSchema,
  ZoneSchema,
} from "@/buchung/logik/schemas";
import { berlinStart } from "@/buchung/logik/zeit";
import { revalidateSite } from "@/cms/revalidate";
import { adminActionClient } from "./client";

// The booking engine's master data. Admins only: prices and the people sent out are the owner's.
// Every change rebuilds the site, whose catalogue, prices and city pages read this data.
const id = z.object({ id: z.number().int().positive() });
const vielleichtId = z.object({ id: z.number().int().positive().nullable() });

const nachher = <T>(ergebnis: T) => {
  revalidateSite();
  return ergebnis;
};

export const speichereFigurAction = adminActionClient
  .inputSchema(vielleichtId.extend({ input: FigurSchema }))
  .action(async ({ parsedInput }) =>
    nachher(await speichereFigur(parsedInput.id, parsedInput.input)),
  );
export const loescheFigurAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => nachher(await loescheFigur(parsedInput.id)));

export const speichereDarstellerAction = adminActionClient
  .inputSchema(vielleichtId.extend({ input: DarstellerSchema }))
  .action(async ({ parsedInput }) =>
    nachher(await speichereDarsteller(parsedInput.id, parsedInput.input)),
  );
export const loescheDarstellerAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => nachher(await loescheDarsteller(parsedInput.id)));

export const speicherePaketAction = adminActionClient
  .inputSchema(vielleichtId.extend({ input: PaketSchema }))
  .action(async ({ parsedInput }) =>
    nachher(await speicherePaket(parsedInput.id, parsedInput.input)),
  );
export const loeschePaketAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => nachher(await loeschePaket(parsedInput.id)));

export const speichereExtraAction = adminActionClient
  .inputSchema(vielleichtId.extend({ input: ExtraSchema }))
  .action(async ({ parsedInput }) =>
    nachher(await speichereExtra(parsedInput.id, parsedInput.input)),
  );
export const loescheExtraAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => nachher(await loescheExtra(parsedInput.id)));

export const speichereZoneAction = adminActionClient
  .inputSchema(z.object({ code: z.string().nullable(), input: ZoneSchema }))
  .action(async ({ parsedInput }) =>
    nachher(await speichereZone(parsedInput.code, parsedInput.input)),
  );
export const loescheZoneAction = adminActionClient
  .inputSchema(z.object({ code: z.string() }))
  .action(async ({ parsedInput }) => nachher(await loescheZone(parsedInput.code)));

export const speichereStadtAction = adminActionClient
  .inputSchema(vielleichtId.extend({ input: StadtSchema }))
  .action(async ({ parsedInput }) =>
    nachher(await speichereStadt(parsedInput.id, parsedInput.input)),
  );
export const loescheStadtAction = adminActionClient
  .inputSchema(id)
  .action(async ({ parsedInput }) => nachher(await loescheStadt(parsedInput.id)));

export const speichereEinstellungenAction = adminActionClient
  .inputSchema(EinstellungenSchema)
  .action(async ({ parsedInput }) => nachher(await speichereEinstellungen(parsedInput)));

// ---------------------------------------------------------------------------------------------
// Operations: a phone order, status steps, the performer's note, time off.

const akteur = (u: { id: number; email: string }) => ({ id: u.id, email: u.email });

export const neueBuchungAction = adminActionClient
  .inputSchema(ManuelleBuchungSchema)
  .action(async ({ parsedInput: e, ctx }) => {
    const beginn = berlinStart(e.tag, e.uhrzeit);
    if (!beginn) throw new BuchungFehler("Diese Uhrzeit gibt es an dem Tag nicht.", "uhrzeit");
    const r = await halteSlot(
      {
        figurId: e.figurId,
        zweiteFigurId: e.zweiteFigurId,
        paketId: e.paketId,
        extraIds: e.extraIds,
        stadtId: e.stadtId,
        beginn,
        zahlungsart: e.zahlungsart,
        kontakt: { name: e.kontaktName, email: e.kontaktEmail, telefon: e.kontaktTelefon },
        adresse: { strasse: e.strasse, plz: e.plz, ort: e.ort },
        kind: { name: e.kindName, alter: e.kindAlter, anzahl: e.kinderAnzahl },
        notizKunde: e.notizKunde,
      },
      { jetzt: new Date(), quelle: e.quelle, akteur: akteur(ctx.user) },
    );
    if (r.ok) {
      // A phone or Instagram order is confirmed at once: the customer gets the confirmation.
      await nachNeuerBuchung(r.buchung.id, r.buchung.zugriffToken, "bestaetigt", null);
      return { ok: true as const, id: r.buchung.id };
    }
    if (r.grund === "belegt")
      return {
        ok: false as const,
        alternativen: r.alternativen.map((d) => d.toISOString()),
      };
    throw new BuchungFehler("Diese Buchung lässt sich so nicht anlegen.");
  });

const StatusSchema = z.discriminatedUnion("nach", [
  z.object({ nach: z.enum(["bestaetigt", "abgeschlossen", "abgelehnt"]) }),
  z.object({
    nach: z.literal("storniert"),
    durch: z.enum(["kunde", "agentur"]),
    grund: z.string().trim().max(300).nullish(),
  }),
]);

export const setzeStatusAction = adminActionClient
  .inputSchema(id.extend({ aenderung: StatusSchema }))
  .action(async ({ parsedInput, ctx }) => {
    const r = await setzeStatus(parsedInput.id, parsedInput.aenderung, akteur(ctx.user));
    if (r.status === "bestaetigt") nachBestaetigung(parsedInput.id, null);
    if (r.storno) await nachStorno(parsedInput.id, r.storno, null);
    return { status: r.status, gebuehrCent: r.storno?.gebuehrCent ?? null };
  });

export const speichereNotizAction = adminActionClient
  .inputSchema(id.extend({ notiz: z.string().nullable() }))
  .action(async ({ parsedInput }) => speichereNotiz(parsedInput.id, parsedInput.notiz));

export const sperreAction = adminActionClient
  .inputSchema(SperreSchema)
  .action(async ({ parsedInput: s, ctx }) => {
    const von = berlinStart(s.vonTag, s.vonZeit);
    const bis = berlinStart(s.bisTag, s.bisZeit);
    if (!von) throw new BuchungFehler("Diese Uhrzeit gibt es an dem Tag nicht.", "vonZeit");
    if (!bis) throw new BuchungFehler("Diese Uhrzeit gibt es an dem Tag nicht.", "bisZeit");
    return sperreDarsteller(
      { darstellerId: s.darstellerId, von, bis, grund: s.grund },
      akteur(ctx.user),
    );
  });
