"use client";

import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  BoldIcon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  Link2Icon,
  Link2OffIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  RedoIcon,
  TextQuoteIcon,
  UndoIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type BlockType = "paragraph" | "h2" | "h3" | "quote" | "bullet" | "number";

const BLOCKS: { value: BlockType; label: string; icon: typeof PilcrowIcon }[] = [
  { value: "paragraph", label: "Absatz", icon: PilcrowIcon },
  { value: "h2", label: "Überschrift", icon: Heading2Icon },
  { value: "h3", label: "Zwischenüberschrift", icon: Heading3Icon },
  { value: "bullet", label: "Aufzählung", icon: ListIcon },
  { value: "number", label: "Nummerierte Liste", icon: ListOrderedIcon },
  { value: "quote", label: "Zitat", icon: TextQuoteIcon },
];

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [block, setBlock] = useState<BlockType>("paragraph");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");

  const readSelection = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    setBold(selection.hasFormat("bold"));
    setItalic(selection.hasFormat("italic"));
    const anchor = selection.anchor.getNode();
    const linkNode = $findMatchingParent(anchor, $isLinkNode);
    setLink(linkNode && $isLinkNode(linkNode) ? linkNode.getURL() : null);
    const element =
      anchor.getKey() === "root"
        ? anchor
        : ($findMatchingParent(anchor, (n) => {
            const parent = n.getParent();
            return parent !== null && $isRootOrShadowRoot(parent);
          }) ?? anchor.getTopLevelElementOrThrow());
    if ($isListNode(element)) {
      const list = $getNearestNodeOfType(anchor, ListNode);
      setBlock((list ?? element).getListType() === "number" ? "number" : "bullet");
    } else if ($isHeadingNode(element)) {
      setBlock(element.getTag() === "h3" ? "h3" : "h2");
    } else if ($isQuoteNode(element)) {
      setBlock("quote");
    } else {
      setBlock("paragraph");
    }
  }, []);

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => editorState.read(readSelection)),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => (readSelection(), false),
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          CAN_UNDO_COMMAND,
          (v) => (setCanUndo(v), false),
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          CAN_REDO_COMMAND,
          (v) => (setCanRedo(v), false),
          COMMAND_PRIORITY_LOW,
        ),
      ),
    [editor, readSelection],
  );

  const setBlockType = (value: BlockType) => {
    if (!value) return;
    if (value === "bullet") return editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    if (value === "number") return editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (block === "bullet" || block === "number")
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      if (value === "paragraph") $setBlocksType(selection, () => $createParagraphNode());
      if (value === "h2" || value === "h3")
        $setBlocksType(selection, () => $createHeadingNode(value));
      if (value === "quote") $setBlocksType(selection, () => $createQuoteNode());
    });
  };

  const applyLink = () => {
    const url = linkDraft.trim();
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url ? { url, target: null } : null);
    setLinkOpen(false);
  };

  return (
    <div
      role="toolbar"
      aria-label="Textformatierung"
      className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1"
    >
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={block}
        onValueChange={(v) => setBlockType(v as BlockType)}
        aria-label="Blocktyp"
      >
        {BLOCKS.map((b) => (
          <Tip key={b.value} label={b.label}>
            <ToggleGroupItem value={b.value} aria-label={b.label}>
              <b.icon />
            </ToggleGroupItem>
          </Tip>
        ))}
      </ToggleGroup>
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
      <Tip label="Fett (⌘B)">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Fett"
          aria-pressed={bold}
          data-state={bold ? "on" : "off"}
          className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        >
          <BoldIcon />
        </Button>
      </Tip>
      <Tip label="Kursiv (⌘I)">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Kursiv"
          aria-pressed={italic}
          data-state={italic ? "on" : "off"}
          className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        >
          <ItalicIcon />
        </Button>
      </Tip>
      <Popover
        open={linkOpen}
        onOpenChange={(open) => (setLinkOpen(open), open && setLinkDraft(link ?? ""))}
      >
        <Tip label={link ? "Link bearbeiten" : "Link einfügen (⌘K)"}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={link ? "Link bearbeiten" : "Link einfügen"}
              aria-pressed={link !== null}
              data-state={link ? "on" : "off"}
              className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            >
              <Link2Icon />
            </Button>
          </PopoverTrigger>
        </Tip>
        <PopoverContent align="start" className="w-80">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              applyLink();
            }}
          >
            <Field>
              <FieldLabel htmlFor="link-url">Adresse</FieldLabel>
              <Input
                id="link-url"
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                placeholder="/leistungen oder https://…"
                autoFocus
              />
            </Field>
            <div className="flex justify-between gap-2">
              {link ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => (
                    setLinkDraft(""),
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null),
                    setLinkOpen(false)
                  )}
                >
                  <Link2OffIcon data-icon="inline-start" /> Entfernen
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" size="sm">
                Übernehmen
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
      <Tip label="Rückgängig (⌘Z)">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Rückgängig"
          disabled={!canUndo}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        >
          <UndoIcon />
        </Button>
      </Tip>
      <Tip label="Wiederholen (⇧⌘Z)">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Wiederholen"
          disabled={!canRedo}
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        >
          <RedoIcon />
        </Button>
      </Tip>
    </div>
  );
}
