import type { LexicalDocument } from "@/cms/rich-text/schema";
import { renderLexical } from "@/cms/rich-text/render";
import { cn } from "@/lib/utils";

export function RichText({
  data,
  className,
}: {
  data: LexicalDocument | null | undefined;
  className?: string;
}) {
  if (!data) return null;
  return (
    <div
      className={cn(
        // Typography's colours mapped onto the site tokens, as the home sections set them: text in
        // the soft muted blue, headings and bold in the foreground, links and bullets in ice.
        "prose max-w-none prose-neutral dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-balance prose-p:text-pretty prose-a:decoration-primary-soft prose-a:underline-offset-4 prose-a:transition-colors hover:prose-a:text-primary-soft",
        className,
      )}
    >
      {renderLexical(data)}
    </div>
  );
}
