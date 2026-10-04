import type { KatalogFigur } from "@/buchung/daten/katalog";
import { SPRACH_NAMEN } from "@/buchung/logik/typen";
import { cn } from "@/lib/utils";

import { FigurBild } from "./figur-bild";
import { Verweis } from "./verweis";

export const altersText = (f: Pick<KatalogFigur, "alterVon" | "alterBis">) =>
  `${f.alterVon} bis ${f.alterBis} Jahre`;

export const sprachenText = (f: Pick<KatalogFigur, "sprachen">) =>
  f.sprachen.map((s) => SPRACH_NAMEN[s]).join(", ");

// A Figur in a list: picture, name, ages and languages; the whole card is the link (the name's
// link stretches over it), so a phone takes it with one tap anywhere.
export function FigurKarte({
  figur,
  sizes,
  className,
}: {
  figur: KatalogFigur;
  sizes: string;
  className?: string;
}) {
  return (
    <article className={cn("group relative", className)}>
      <FigurBild
        foto={figur.foto}
        name={figur.name}
        sizes={sizes}
        className="aspect-4/5 group-has-focus-visible:ring-3 group-has-focus-visible:ring-ring"
      />
      {figur.buchbar ? null : (
        <p className="absolute top-3 left-3 rounded-full bg-card px-3 py-1 text-sm font-medium">
          Auf Anfrage
        </p>
      )}
      <h3 className="mt-3 font-hand text-xl leading-tight font-semibold text-balance sm:text-2xl">
        <Verweis
          href={`/figuren/${figur.slug}` as never}
          className="outline-none after:absolute after:inset-0 after:rounded-3xl"
        >
          {figur.name}
        </Verweis>
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{altersText(figur)}</p>
      <p className="text-sm text-muted-foreground">{sprachenText(figur)}</p>
    </article>
  );
}
