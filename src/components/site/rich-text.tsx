import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { RichText as PayloadRichText } from "@payloadcms/richtext-lexical/react";

import { cn } from "@/lib/utils";

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
      className={cn("prose max-w-none prose-neutral dark:prose-invert", className)}
    />
  );
}
