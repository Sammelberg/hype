"use client";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";
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
import { isActive, NAV_GROUPS, NAV_HOME, type NavItem } from "./nav";
import { UserMenu } from "./user-menu";

// The ice bar beside the open section glides to the next one when the section changes — it
// shows where the click went. Without motion it simply moves.
function ActiveMark() {
  const reduce = useReducedMotion();
  return (
    <motion.span
      layoutId="nav-active"
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary-soft group-data-[collapsible=icon]:hidden"
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42 }}
    />
  );
}

export type NavBadge = { anzahl: number; label: string };

function Item({ item, badge }: { item: NavItem; badge?: NavBadge }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  return (
    <SidebarMenuItem>
      {active ? <ActiveMark /> : null}
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.label}
        className="transition-[background-color,color] duration-150 data-[active=true]:text-sidebar-accent-foreground [&>svg]:transition-colors data-[active=true]:[&>svg]:text-primary-soft"
      >
        <Link href={item.href as never}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
      {badge && badge.anzahl > 0 ? (
        <SidebarMenuBadge aria-label={badge.label}>{badge.anzahl}</SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}

export function AppSidebar({
  siteName,
  user,
  badges,
}: {
  siteName: string;
  user: { name: string | null; email: string; role: Role };
  /** Per section: what waits there (unread inquiries, Wiedervorlagen due, overdue invoices). */
  badges: Record<string, NavBadge>;
}) {
  // What the role may not open is not shown; the pages refuse it on their own as well.
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => mayOpen(user.role, item.href)),
  })).filter((g) => g.items.length > 0);
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={siteName}>
              <Link href={"/admin" as never}>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18)]">
                  <FirMark className="size-5" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="truncate font-semibold tracking-tight">{siteName}</span>
                  <span className="truncate text-xs text-muted-foreground">Verwaltung</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Bereiche" className="contents">
          <LayoutGroup id="admin-nav">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <Item item={NAV_HOME} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {groups.map((g) => (
              <SidebarGroup key={g.label}>
                <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {g.items.map((item) => (
                      <Item key={item.href} item={item} badge={badges[item.href]} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </LayoutGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
