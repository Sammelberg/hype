import { type CSSProperties, type ElementType, Fragment } from "react";

// A heading or line set word by word on the server, for motion that moves the words: a <Reveal>
// around it lets them rise in turn (globals.css), a scroll scene moves `[data-wort]` with a
// stagger. Splitting in the browser (SplitText) waited for the fonts, read the layout and hid the
// text until it had run. Each word sits in a mask (overflow clip) and stays a word for line
// breaking; screen readers get the sentence once, not word by word.
export function Worte({
  text,
  as,
  className,
}: {
  text: string;
  as?: ElementType;
  className?: string;
}) {
  const Tag: ElementType = as ?? "span";
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span aria-hidden className="inline-block overflow-clip pb-[0.1em] align-bottom">
            <span data-wort="" style={{ "--wort": i } as CSSProperties} className="inline-block">
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
