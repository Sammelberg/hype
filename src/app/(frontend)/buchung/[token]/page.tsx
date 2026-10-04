import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { kundenSicht, type KundenSicht } from "@/buchung/daten/buchen";
import { preisText } from "@/buchung/logik/preis";
import { terminText } from "@/buchung/logik/zeit";
import { Abriss, EinladungsKarte } from "@/components/site/einladungs-karte";
import { Verweis } from "@/components/site/verweis";
import { onlineZahlung } from "@/lib/zahlung";

import { storniere, zahleAnzahlung } from "./actions";
import { StornoKnopf, ZahlenKnopf } from "./_components/knoepfe";

// A Buchung behind its customer's link (only the link's sha256 is stored): where it stands, what
// it costs, paying the Anzahlung of a held one, cancelling where the grid allows it. Rendered per
// visit; never indexed, never sent on as a referrer.

export const metadata: Metadata = {
  title: "Ihre Buchung",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const termin = (d: Date) => {
  const t = terminText(d);
  return `${t.wochentag}, ${t.tag}, ${t.uhrzeit} Uhr`;
};

function Lage({ b, hinweis }: { b: KundenSicht; hinweis: string | undefined }) {
  switch (b.status) {
    case "anfrage":
      return {
        titel: "Ihre Anfrage ist bei uns",
        text: "Wir prüfen den Termin und melden uns mit einem Angebot. Bezahlt wird erst, wenn Sie zusagen.",
      };
    case "reserviert":
      if (b.zahlungsart === "rechnung")
        return {
          titel: "Ihr Termin ist reserviert",
          text: `Wir halten ihn für ${b.rechnungAn ?? "Sie"} und schicken die Rechnung über die Anzahlung. Sobald sie bezahlt ist, ist der Termin fest gebucht.`,
        };
      return {
        titel: "Ihr Termin ist reserviert",
        text: b.haltenBis
          ? `Wir halten ihn bis ${terminText(b.haltenBis).uhrzeit} Uhr. Mit der Anzahlung ist er fest für Sie gebucht.${hinweis === "abgebrochen" ? " Die Zahlung wurde abgebrochen; Sie können es noch einmal versuchen." : ""}`
          : "Mit der Anzahlung ist er fest für Sie gebucht.",
      };
    case "bestaetigt":
      return {
        titel: "Gebucht. Wir freuen uns auf die Feier!",
        text: "Die Figur kommt pünktlich zum Beginn. Haben Sie Fragen oder ändert sich etwas, schreiben Sie uns.",
      };
    case "verfallen":
      return {
        titel: "Die Reservierung ist abgelaufen",
        text: "Die Anzahlung kam nicht rechtzeitig, deshalb ist der Termin wieder frei. Wählen Sie ihn gern noch einmal.",
      };
    case "storniert":
      return {
        titel: "Die Buchung ist storniert",
        text:
          b.stornoGebuehrCent && b.stornoGebuehrCent > 0
            ? `Nach den Bedingungen für Absagen fallen ${preisText(b.stornoGebuehrCent)} an.`
            : "Es fallen keine Kosten an.",
      };
    case "abgelehnt":
      return {
        titel: "Diesen Termin können wir leider nicht übernehmen",
        text: "Schauen Sie gern nach einem anderen Tag oder schreiben Sie uns.",
      };
    case "abgeschlossen":
      return { titel: "Danke, dass Sie mit uns gefeiert haben", text: "" };
  }
}

export default async function BuchungSeite({ params, searchParams }: Props) {
  await connection();
  const [{ token }, such] = await Promise.all([params, searchParams]);
  const jetzt = new Date();
  const b = await kundenSicht(token, jetzt);
  if (!b) notFound();

  const hinweis = typeof such.abgebrochen === "string" ? "abgebrochen" : undefined;
  const lage = Lage({ b, hinweis });
  const zahlbar =
    b.status === "reserviert" &&
    b.zahlungsart !== "rechnung" &&
    b.haltenBis !== null &&
    b.haltenBis.getTime() > jetzt.getTime() &&
    (b.anzahlungCent ?? 0) > 0 &&
    onlineZahlung() !== null;
  // Online only while the grid decides alone: held, or confirmed more than seven days ahead.
  const stornierbar =
    b.storno !== null && (b.status === "reserviert" || b.storno.entscheidung === "auto");
  const folgen = !b.storno
    ? ""
    : b.storno.gebuehrCent === 0
      ? b.storno.erstattungCent > 0
        ? `Sie bekommen ${preisText(b.storno.erstattungCent)} zurück.`
        : "Es fallen keine Kosten an."
      : `Nach den Bedingungen für Absagen fallen ${preisText(b.storno.gebuehrCent)} an.`;

  return (
    <main className="page-container grid gap-10 pt-10 pb-16 sm:pt-14 lg:grid-cols-[1fr_26rem] lg:gap-16 lg:pb-24">
      <div>
        <p className="font-medium text-muted-foreground tabular-nums">Buchung {b.nummer}</p>
        <h1 className="mt-2 font-hand text-4xl leading-tight font-semibold text-balance sm:text-5xl">
          {lage.titel}
        </h1>
        {lage.text ? (
          <p className="mt-4 max-w-2xl text-lg text-pretty" role="status">
            {lage.text}
          </p>
        ) : null}

        {zahlbar ? (
          <div className="mt-8">
            <ZahlenKnopf
              aktion={zahleAnzahlung.bind(null, token)}
              betrag={preisText(b.anzahlungCent!)}
            />
          </div>
        ) : null}
        {b.status === "verfallen" || b.status === "abgelehnt" ? (
          <Verweis
            href={"/buchen" as never}
            className="mt-8 inline-flex min-h-11 items-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground"
          >
            Neuen Termin wählen
          </Verweis>
        ) : null}

        {b.storno ? (
          <section aria-labelledby="absagen-titel" className="mt-14 max-w-2xl border-t pt-8">
            <h2 id="absagen-titel" className="text-xl font-semibold">
              Absagen
            </h2>
            {stornierbar ? (
              <>
                <p className="mt-2 text-base text-pretty">Wenn Sie jetzt absagen: {folgen}</p>
                <div className="mt-4">
                  <StornoKnopf aktion={storniere.bind(null, token)} folgen={folgen} />
                </div>
              </>
            ) : (
              <p className="mt-2 text-base text-pretty">
                So kurz vor der Feier sagen wir gemeinsam mit Ihnen ab. Bitte schreiben Sie uns über
                das{" "}
                <Verweis href="/kontakt" className="underline underline-offset-4">
                  Kontaktformular
                </Verweis>{" "}
                und nennen Sie die Nummer {b.nummer}.
              </p>
            )}
          </section>
        ) : null}
      </div>

      <EinladungsKarte className="self-start lg:sticky lg:top-24">
        <p className="font-hand text-2xl font-semibold">
          {b.figuren.length > 0 ? b.figuren.join(" und ") : "Ihre Feier"}
        </p>
        <dl className="mt-3 grid gap-2 text-base">
          <div>
            <dt className="text-sm text-muted-foreground">
              {b.status === "anfrage" ? "Wunschtermin" : "Termin"}
            </dt>
            <dd className="font-medium">{termin(b.beginn)}</dd>
          </div>
          {b.paket ? (
            <div>
              <dt className="text-sm text-muted-foreground">Paket</dt>
              <dd className="font-medium">{b.paket}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-sm text-muted-foreground">Ort</dt>
            <dd className="font-medium">{b.adresse || b.stadt}</dd>
          </div>
        </dl>
        {b.positionen.length > 0 ? (
          <Abriss>
            <ul className="grid gap-1.5 text-base">
              {b.positionen.map((p) => (
                <li key={p.bezeichnung} className="flex justify-between gap-3">
                  <span>{p.bezeichnung}</span>
                  <span className="tabular-nums">
                    {p.cent === 0 ? "inklusive" : preisText(p.cent)}
                  </span>
                </li>
              ))}
            </ul>
            {b.summeCent !== null ? (
              <>
                <p className="mt-3 flex justify-between gap-3 text-xl font-semibold">
                  <span>Summe</span>
                  <span className="tabular-nums">{preisText(b.summeCent)}</span>
                </p>
                {b.anzahlungCent ? (
                  <p className="mt-1 flex justify-between gap-3 text-base text-muted-foreground">
                    <span>davon Anzahlung</span>
                    <span className="tabular-nums">{preisText(b.anzahlungCent)}</span>
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-base text-muted-foreground">
                Den Gesamtpreis nennen wir Ihnen mit dem Angebot.
              </p>
            )}
          </Abriss>
        ) : null}
      </EinladungsKarte>
    </main>
  );
}
