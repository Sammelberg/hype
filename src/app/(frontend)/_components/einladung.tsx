"use client";

import { useState } from "react";

import { Abriss, EinladungsKarte } from "@/components/site/einladungs-karte";
import { buttonVariants } from "@/components/ui/button";

export type EinladungsOrt = {
  slug: string;
  name: string;
  /** „ab 169 €“, the lowest package with the town's travel; null when the town only takes requests. */
  preis: string | null;
  /** „21. November“, the first free Saturday; null when none in the next weeks or only requests. */
  samstag: string | null;
};

// The home page's invitation card, alive: choosing the town changes the price (package plus the
// town's travel) and the next free Saturday at once, before anyone types a name. The values are
// computed on the server for every town; the card only picks one. Sends to /buchen?ort=… .
export function Einladung({
  orte,
  start,
  paket,
}: {
  orte: EinladungsOrt[];
  start: string;
  /** The package the „ab“ price belongs to, e.g. „Mini, 45 Minuten“. */
  paket: string | null;
}) {
  const [slug, setSlug] = useState(start);
  const ort = orte.find((o) => o.slug === slug) ?? orte[0];
  if (!ort) return null;

  return (
    <EinladungsKarte className="sm:-rotate-1">
      <form action="/buchen" method="get">
        <p className="font-hand text-2xl font-semibold sm:text-3xl">
          Die Eisprinzessin kommt zu Ihnen
        </p>
        <p className="mt-2 text-base text-muted-foreground">
          Oder eine andere Figur. Sie wählen gleich im nächsten Schritt.
        </p>
        <Abriss>
          <label htmlFor="start-ort" className="text-sm font-medium">
            Wo feiern Sie?
          </label>
          <select
            id="start-ort"
            name="ort"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-2 w-full rounded-lg border border-input bg-card px-4 py-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            {orte.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>

          {/* Announced when the town changes; the key replays the short rise of the new values. */}
          <div aria-live="polite">
            <div
              key={ort.slug}
              className="animate-in duration-200 fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
            >
              {ort.preis ? (
                <>
                  <p className="mt-5 text-4xl font-semibold tabular-nums">{ort.preis}</p>
                  <p className="mt-1 text-base text-muted-foreground">
                    {paket ? `${paket}. ` : ""}Anfahrt nach {ort.name} inklusive.
                  </p>
                </>
              ) : (
                <p className="mt-5 text-lg">
                  Nach {ort.name} kommen wir auf Anfrage. Sie nennen den Wunschtermin, wir melden
                  uns mit einem Angebot.
                </p>
              )}
              {ort.preis ? (
                <p className="mt-4 text-base">
                  {ort.samstag ? (
                    <>
                      Nächster freier Samstag:{" "}
                      <span className="rounded-md bg-highlight px-1.5 font-medium whitespace-nowrap text-highlight-foreground">
                        {ort.samstag}
                      </span>
                    </>
                  ) : (
                    "Samstags ist bis auf Weiteres alles vergeben; unter der Woche ist noch Platz."
                  )}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            className={buttonVariants({
              size: "lg",
              className: "mt-6 h-auto w-full rounded-full py-3.5 text-base font-semibold",
            })}
          >
            {ort.preis ? "Jetzt buchen" : "Anfrage stellen"}
          </button>
        </Abriss>
      </form>
    </EinladungsKarte>
  );
}
