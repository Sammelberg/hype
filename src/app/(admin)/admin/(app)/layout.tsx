import type { ReactNode } from "react";

import { requireUser } from "@/cms/auth/guard";
import { countUnreadSubmissions } from "@/cms/content/forms";
import { listPages } from "@/cms/content/pages";
import { listProjekte } from "@/cms/content/projekte";
import { getSiteSettings } from "@/cms/content/site-settings";
import { listAuftraegeAuswahl } from "@/buero/daten/auftraege";
import { listKundenAuswahl } from "@/buero/daten/kunden";
import { listRechnungen } from "@/buero/daten/rechnungen";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "../_components/app-sidebar";
import { CommandPalette, type PaletteEntry } from "../_components/command-palette";

// Everything below /admin except the login and the password page: a signed-in user, the sidebar, ⌘K.
export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const [settings, unread, pages, projekte, kunden, auftraege, rechnungen] = await Promise.all([
    getSiteSettings(),
    countUnreadSubmissions(),
    listPages(),
    listProjekte(),
    listKundenAuswahl(),
    listAuftraegeAuswahl(),
    listRechnungen(),
  ]);
  const entries: PaletteEntry[] = [
    ...kunden.map((k) => ({
      label: k.name,
      href: `/admin/kunden/${k.id}`,
      group: "Kunden",
      keywords: `${k.nummer} ${k.ort ?? ""}`,
    })),
    ...auftraege.map((a) => ({
      label: a.titel,
      href: `/admin/auftraege/${a.id}`,
      group: "Aufträge",
      keywords: a.nummer,
    })),
    ...rechnungen
      .filter((r) => r.nummer)
      .map((r) => ({
        label: `${r.nummer} ${r.kundeName}`,
        href: `/admin/rechnungen/${r.id}`,
        group: "Rechnungen",
        keywords: r.kundeName,
      })),
    ...pages.map((p) => ({
      label: p.title,
      href: `/admin/seiten/${p.id}`,
      group: "Seiten",
      keywords: p.path,
    })),
    ...projekte.map((p) => ({
      label: p.title,
      href: `/admin/projekte/${p.id}`,
      group: "Projekte",
      keywords: p.kunde,
    })),
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider>
        <AppSidebar siteName={settings?.siteName ?? "Website"} user={user} unread={unread} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" aria-label="Navigation ein- oder ausblenden" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <p className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              Schnell wechseln mit
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </p>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-2 sm:p-6 sm:pt-2">{children}</div>
        </SidebarInset>
        <CommandPalette entries={entries} />
      </SidebarProvider>
    </TooltipProvider>
  );
}
