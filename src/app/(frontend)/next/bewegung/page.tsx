import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/motion/reveal";
import { Schleife } from "@/components/motion/schleife";
import { StickyStage } from "@/components/motion/sticky-stage";
import { Worte } from "@/components/motion/worte";
import { env } from "@/env";

import { Szenen } from "./_components/szenen";

export const metadata: Metadata = {
  title: "Bewegung",
  robots: { index: false, follow: false },
};

// Every motion part of kern at work, to look at before building a section and for e2e
// (e2e/bewegung.spec.ts, the scroll budget). Served by `next dev`; a production build only with
// MOTION_DEMO=1 (CI), never on a server.
export default function BewegungPage() {
  if (process.env.NODE_ENV === "production" && !env.MOTION_DEMO) notFound();
  const karten = ["Eins", "Zwei", "Drei", "Vier", "Fünf"];
  return (
    <main className="page-container py-16" data-bewegung="">
      <h1 className="text-4xl font-semibold tracking-tight">Bewegung</h1>
      <p className="mt-4 max-w-prose text-muted-foreground">
        Jede Bewegung dieser Seite läuft auf dem Compositor: Szenen auf der Scroll-Zeitachse des
        Browsers, Auftritte als CSS-Übergang, Schleifen pausieren außerhalb des Bildschirms.
      </p>

      <div className="h-[80vh]" />

      <Szenen>
        <section
          data-parallaxe-bereich=""
          className="relative h-[70vh] overflow-hidden rounded-xl bg-muted"
        >
          <div data-parallaxe="" className="absolute inset-x-0 top-0 h-[130%] bg-secondary" />
          <p className="relative p-8 text-2xl font-medium">Parallaxe</p>
        </section>

        <div className="h-[40vh]" />

        <StickyStage length="200svh" className="mt-16" stageClassName="flex items-center">
          <div data-reihe="" className="flex gap-8 px-8">
            {karten.map((karte, i) => (
              <article
                key={karte}
                data-karte={i}
                className="flex h-[50vh] w-[60vw] shrink-0 items-end rounded-xl border bg-card p-8 text-3xl font-semibold"
              >
                {karte}
              </article>
            ))}
          </div>
          <p
            data-schritt-anzeige=""
            className="absolute bottom-6 left-8 text-sm text-muted-foreground"
          />
        </StickyStage>
      </Szenen>

      <div className="h-[40vh]" />

      <Reveal as="section" data-auftritt="" className="max-w-prose">
        <Worte
          as="h2"
          text="Einmal auftreten, wenn es sichtbar wird"
          className="text-3xl font-semibold"
        />
        <p className="mt-4 text-muted-foreground">Ein Übergang in CSS, kein Skript pro Bild.</p>
      </Reveal>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {["A", "B", "C"].map((x, i) => (
          <Reveal key={x} order={i} className="rounded-xl border bg-card p-6">
            Karte {x}
          </Reveal>
        ))}
      </div>

      <div className="h-[60vh]" />

      <Schleife data-schleife="" className="flex items-center gap-4">
        <span className="block size-12 rounded-full border-4 border-primary border-t-transparent motion-safe:animate-spin" />
        Eine Schleife, die außerhalb des Bildschirms ruht.
      </Schleife>

      <div className="h-[60vh]" />
    </main>
  );
}
