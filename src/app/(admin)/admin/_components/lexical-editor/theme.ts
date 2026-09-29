import type { EditorThemeClasses } from "lexical";

// Class names Lexical puts on its DOM; the look comes from the prose styles of the editor box.
export const editorTheme: EditorThemeClasses = {
  paragraph: "mb-3 last:mb-0",
  heading: {
    h2: "mt-6 mb-3 text-xl font-semibold tracking-tight",
    h3: "mt-5 mb-2 text-lg font-semibold tracking-tight",
  },
  quote: "my-3 border-l-2 border-primary/50 pl-4 text-muted-foreground",
  list: {
    ul: "my-3 list-disc pl-6",
    ol: "my-3 list-decimal pl-6",
    listitem: "my-1",
    nested: { listitem: "list-none" },
  },
  link: "text-primary-soft underline underline-offset-4",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]",
  },
};
