"use client";

import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { useId } from "react";

import { emptyDocument, type LexicalDocument } from "@/cms/rich-text/schema";
import { fromEditorDocument, toEditorDocument } from "@/cms/rich-text/lexical-io";
import { cn } from "@/lib/utils";
import { editorTheme } from "./theme";
import { Toolbar } from "./toolbar";

// Absolute URLs and our own paths; nothing else becomes a link.
const validateUrl = (url: string) => /^(https?:\/\/|mailto:|tel:|\/)/i.test(url);

// Uncontrolled after mount: pass a new `key` to load another document (a restored version).
export function LexicalEditor({
  id,
  value,
  onChange,
  label,
  className,
  invalid,
}: {
  id?: string;
  value: LexicalDocument | null;
  onChange: (doc: LexicalDocument) => void;
  label: string;
  className?: string;
  invalid?: boolean;
}) {
  const fallbackId = useId();
  const editableId = id ?? fallbackId;
  const initial = JSON.stringify(
    toEditorDocument(value && value.root.children.length > 0 ? value : emptyDocument()),
  );
  return (
    <LexicalComposer
      initialConfig={{
        namespace: "cms",
        theme: editorTheme,
        nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
        editorState: initial,
        onError: (error) => {
          throw error;
        },
      }}
    >
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-card transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          invalid && "border-destructive",
          className,
        )}
      >
        <Toolbar />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              id={editableId}
              aria-label={label}
              aria-invalid={invalid || undefined}
              className="min-h-64 px-4 py-3 text-base leading-relaxed outline-none"
            />
          }
          placeholder={
            <p
              aria-hidden="true"
              className="pointer-events-none absolute top-3 left-4 text-muted-foreground select-none"
            >
              Schreiben Sie hier …
            </p>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin validateUrl={validateUrl} />
        <OnChangePlugin
          ignoreSelectionChange
          onChange={(state) =>
            onChange(fromEditorDocument(state.toJSON() as unknown as LexicalDocument))
          }
        />
      </div>
    </LexicalComposer>
  );
}
