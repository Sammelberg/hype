"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { mayOpen, type Role } from "@/cms/auth/roles";
import { NAV_ALL } from "./nav";

export type PaletteEntry = { label: string; href: string; group: string; keywords?: string };

// ⌘K / Ctrl+K: every section and every document by name. Opened by keyboard many times a day,
// so it appears without animation.
export function CommandPalette({ entries, role }: { entries: PaletteEntry[]; role: Role }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href as never);
  };

  const groups = new Map<string, PaletteEntry[]>();
  for (const entry of entries) groups.set(entry.group, [...(groups.get(entry.group) ?? []), entry]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Suchen und springen"
      description="Bereiche, Seiten und Projekte nach Namen"
      className="data-[state=closed]:animate-none data-[state=open]:animate-none"
    >
      <Command label="Vorschläge">
        <CommandInput placeholder="Wohin? Seite, Projekt oder Bereich …" />
        <CommandList>
          <CommandEmpty>Nichts gefunden.</CommandEmpty>
          <CommandGroup heading="Bereiche">
            {NAV_ALL.filter((item) => mayOpen(role, item.href)).map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.label} ${item.keywords ?? ""}`}
                onSelect={() => go(item.href)}
              >
                <item.icon />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          {[...groups.entries()].map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((entry) => (
                <CommandItem
                  key={entry.href}
                  value={`${entry.label} ${entry.keywords ?? ""}`}
                  onSelect={() => go(entry.href)}
                >
                  {entry.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
