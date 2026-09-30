"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mayOpen, type Role } from "@/cms/auth/roles";
import { FirMark } from "@/components/site/fir-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { isActive, NAV_BUERO, NAV_CONTENT, NAV_SITE, type NavItem } from "./nav";
import { UserMenu } from "./user-menu";

function Items({ items, unread }: { items: NavItem[]; unread: number }) {
  const pathname = usePathname();
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild isActive={isActive(pathname, item.href)} tooltip={item.label}>
            <Link href={item.href as never}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
          {item.href === "/admin/anfragen" && unread > 0 ? (
            <SidebarMenuBadge aria-label={`${unread} ungelesen`}>{unread}</SidebarMenuBadge>
          ) : null}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppSidebar({
  siteName,
  user,
  unread,
}: {
  siteName: string;
  user: { name: string | null; email: string; role: Role };
  unread: number;
}) {
  // What the role may not open is not shown; the pages refuse it on their own as well.
  const visible = (items: NavItem[]) => items.filter((item) => mayOpen(user.role, item.href));
  const buero = visible(NAV_BUERO);
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Übersicht">
              <Link href={"/admin" as never}>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <FirMark className="size-5" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="truncate font-medium">{siteName}</span>
                  <span className="truncate text-xs text-muted-foreground">Verwaltung</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Bereiche" className="contents">
          <SidebarGroup>
            <SidebarGroupLabel>Inhalte</SidebarGroupLabel>
            <SidebarGroupContent>
              <Items items={visible(NAV_CONTENT)} unread={unread} />
            </SidebarGroupContent>
          </SidebarGroup>
          {buero.length ? (
            <SidebarGroup>
              <SidebarGroupLabel>Büro</SidebarGroupLabel>
              <SidebarGroupContent>
                <Items items={buero} unread={0} />
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}
          <SidebarGroup>
            <SidebarGroupLabel>Betrieb</SidebarGroupLabel>
            <SidebarGroupContent>
              <Items items={visible(NAV_SITE)} unread={0} />
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
