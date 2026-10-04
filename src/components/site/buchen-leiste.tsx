"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";

import { Verweis } from "./verweis";

// The phone's booking bar: one button at the bottom of the screen, on every page but the booking
// itself. A page that shows its own invitation card (`data-buchen-ziel`) keeps the bar away
// while the card is on screen, so there are never two buttons in view. On a Figur's or a town's
// page the bar books that Figur or that town. One IntersectionObserver, nothing per frame.
const OHNE = ["/buchen", "/buchung", "/kontakt"];

function zielVon(pfad: string) {
  const [, art, slug] = pfad.split("/");
  if (art === "figuren" && slug) return `/buchen?figur=${slug}`;
  if (art === "kindergeburtstag" && slug) return `/buchen?ort=${slug}`;
  return "/buchen";
}

export function BuchenLeiste() {
  const pfad = usePathname();
  // Which page the observation belongs to: after a route change the old answer no longer counts,
  // and until the first answer the bar stays down (it rises once the page is known).
  const [karte, setKarte] = useState({ pfad: "", sichtbar: false });

  useEffect(() => {
    // Without a card of its own the page answers through <body>, which never counts as one.
    const karten = [...document.querySelectorAll("[data-buchen-ziel]")];
    const sichtbar = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && karten.includes(e.target)) sichtbar.add(e.target);
        else sichtbar.delete(e.target);
      }
      setKarte({ pfad, sichtbar: sichtbar.size > 0 });
    });
    for (const k of karten.length > 0 ? karten : [document.body]) observer.observe(k);
    return () => observer.disconnect();
  }, [pfad]);

  if (OHNE.some((p) => pfad === p || pfad.startsWith(`${p}/`))) return null;
  const versteckt = karte.pfad !== pfad || karte.sichtbar;

  return (
    <div
      inert={versteckt}
      className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background px-gutter pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-200 ease-out motion-reduce:transition-none md:hidden ${versteckt ? "translate-y-full" : "translate-y-0"}`}
    >
      <Verweis
        href={zielVon(pfad) as never}
        className={buttonVariants({
          size: "lg",
          className: "h-auto w-full rounded-full py-3.5 text-base font-semibold",
        })}
      >
        Jetzt buchen
      </Verweis>
    </div>
  );
}
