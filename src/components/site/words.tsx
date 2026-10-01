import type { CSSProperties } from "react";

// Text split into words for the motion in motion.css. The words stay plain inline text with their
// spaces, so screen readers, copying and hyphenation see one sentence.

const wordsOf = (text: string) => text.split(/\s+/).filter(Boolean);

/** A heading whose words rise from below their line, one after another, when the page opens. */
export function RisingWords({ text }: { text: string }) {
  const words = wordsOf(text);
  return (
    <span className="rise-words">
      {words.map((word, i) => (
        <span key={`${i}-${word}`}>
          <span data-rw="">
            <span style={{ "--i": i } as CSSProperties}>{word}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

/**
 * Words that light up in reading order while the block crosses the screen (scroll-driven). The
 * element carrying `sd-words` is the timeline: pass it as className of the parent, or let this
 * component's own span carry it.
 */
export function LitWords({ text, own = true }: { text: string; own?: boolean }) {
  const words = wordsOf(text);
  const last = Math.max(1, words.length - 1);
  return (
    <span className={own ? "block sd-words" : undefined}>
      {words.map((word, i) => (
        <span key={`${i}-${word}`}>
          <span data-sw="" style={{ "--f": (i / last).toFixed(3) } as CSSProperties}>
            {word}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
