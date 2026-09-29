import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import {
  type JSXConvertersFunction,
  LinkJSXConverter,
  RichText as PayloadRichText,
} from "@payloadcms/richtext-lexical/react";

import { docPath } from "@/cms/paths";
import { cn } from "@/lib/utils";

// A link to a page or project chosen in the editor resolves to that document's public path.
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({
    internalDocToHref: ({ linkNode }) => {
      const { relationTo, value } = linkNode.fields.doc ?? {};
      if (!value || typeof value !== "object") return "#";
      return docPath(relationTo, value as Record<string, unknown>) ?? "#";
    },
  }),
});

export function RichText({
  data,
  className,
}: {
  data: SerializedEditorState | null | undefined;
  className?: string;
}) {
  if (!data) return null;
  return (
    <PayloadRichText
      data={data}
      converters={converters}
      className={cn(
        // Typography's colours mapped onto the site tokens, as the home sections set them: text in
        // the soft muted blue, headings and bold in the foreground, links and bullets in ice.
        "prose max-w-none prose-invert [--tw-prose-invert-body:var(--muted-foreground)] [--tw-prose-invert-bold:var(--foreground)] [--tw-prose-invert-bullets:var(--primary-soft)] [--tw-prose-invert-counters:var(--primary-soft)] [--tw-prose-invert-headings:var(--foreground)] [--tw-prose-invert-hr:var(--border)] [--tw-prose-invert-links:var(--foreground)] [--tw-prose-invert-quote-borders:var(--primary-soft)] [--tw-prose-invert-quotes:var(--foreground)] prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-balance prose-p:text-pretty prose-a:decoration-primary-soft prose-a:underline-offset-4 prose-a:transition-colors hover:prose-a:text-primary-soft",
        className,
      )}
    />
  );
}
