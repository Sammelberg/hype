import Image from "next/image";

import type { MediaDoc } from "@/cms/content/types";
import { cn } from "@/lib/utils";

// A Figur's picture, or until there is one its placeholder: an invitation card on Flieder with the
// Figur's initial, so the catalogue reads as designed before the owner's photos arrive. The frame
// sets the shape (aspect ratio, radius); the picture fills it at its focal point.
export function FigurBild({
  foto,
  name,
  sizes,
  preload,
  className,
}: {
  foto: MediaDoc | null;
  name: string;
  sizes: string;
  preload?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl bg-secondary", className)}>
      {foto ? (
        <Image
          src={foto.url}
          alt={foto.alt || name}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
          style={{ objectPosition: `${foto.focalX}% ${foto.focalY}%` }}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-3 rounded-2xl border-2 border-dashed border-foreground/20"
        >
          <span className="absolute inset-0 grid place-items-center font-hand text-8xl font-semibold text-primary select-none">
            {name.charAt(0)}
          </span>
        </div>
      )}
    </div>
  );
}
