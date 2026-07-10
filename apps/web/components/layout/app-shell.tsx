"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  Bell,
  Bot,
  Brain,
  CalendarClock,
  ChevronLeft,
  ChevronsLeftRight,
  FileText,
  GitBranch,
  KanbanSquare,
  LayoutDashboard,
  LibraryBig,
  Moon,
  Network,
  PanelRightOpen,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
  Workflow,
} from "lucide-react";
import { CommandPalette } from "@/components/layout/command-palette";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

const navItems = [
  { href: "/dashboard", key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ai-chat", key: "ai-chat", label: "AI Assistant", icon: Bot },
  { href: "/projects", key: "projects", label: "Projects", icon: LibraryBig },
  { href: "/sprint-board", key: "sprint-board", label: "Sprint Board", icon: KanbanSquare },
  { href: "/meeting-intelligence", key: "meeting-intelligence", label: "Meetings", icon: CalendarClock },
  { href: "/workflows", key: "workflows", label: "Workflows", icon: Workflow },
  { href: "/reports", key: "reports", label: "Reports", icon: FileText },
  { href: "/memories", key: "memories", label: "Memories", icon: Brain },
  { href: "/documents", key: "documents", label: "Documents", icon: GitBranch },
  { href: "/notifications", key: "notifications", label: "Notifications", icon: Bell },
  { href: "/integrations", key: "integrations", label: "Integrations", icon: Network },
  { href: "/organization-settings", key: "organization-settings", label: "Settings", icon: Settings }
];

export function AppShell({ active, children }: { active: string; children: ReactNode }) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandOpen]);

  const activeLabel = navItems.find((item) => item.key === active)?.label ?? titleFromSlug(active);

  return (
    <div className="min-h-screen lg:grid" style={{ gridTemplateColumns: collapsed ? "88px 1fr" : "280px 1fr" }}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-background/92 px-3 py-4 backdrop-blur-xl transition-all lg:block",
          collapsed ? "w-[88px]" : "w-[280px]"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2 px-2">
            <Logo compact={collapsed} />
            <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Collapse sidebar">
              <ChevronLeft className={cn("h-4 w-4 transition", collapsed && "rotate-180")} />
            </Button>
          </div>

          <Button className="mt-5 w-full" asChild>
            <Link href="/ai-chat">
              <Sparkles className="h-4 w-4" />
              {!collapsed ? "New chat" : null}
            </Link>
          </Button>

          <nav className="mt-5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = active === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex h-10 items-center gap-3 rounded-md px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    selected
                      ? "bg-primary/15 text-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed ? <span>{item.label}</span> : null}
                  {selected && !collapsed ? <span className="ml-auto h-2 w-2 rounded-full bg-accent" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-lg border border-border bg-card p-3">
            {!collapsed ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Organization</p>
                  <ChevronsLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="mt-1 text-sm font-medium">NovaStack Labs</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-accent/10 text-xs font-semibold text-accent">LL</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">Lithira Liyanage</p>
                    <p className="text-xs text-muted-foreground">Owner</p>
                  </div>
                </div>
              </>
            ) : (
              <Users className="mx-auto h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </aside>

      <main className={cn("min-h-screen transition-all lg:col-start-2", collapsed ? "lg:ml-[88px]" : "lg:ml-[280px]")}>
        <header className="sticky top-0 z-30 border-b border-border bg-background/82 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">SprintMind AI / {activeLabel}</p>
              <h1 className="truncate font-display text-lg font-semibold">{activeLabel}</h1>
            </div>
            <div className="ml-auto hidden items-center gap-2 md:flex">
              <Button variant="secondary" className="w-72 justify-start text-muted-foreground" onClick={() => setCommandOpen(true)}>
                <Search className="h-4 w-4" />
                Search or run command
                <span className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px]">Ctrl K</span>
              </Button>
              <Badge tone="warning">Demo Jira</Badge>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" aria-label="Context panel">
                <PanelRightOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="px-4 py-5 lg:px-6">{children}</div>
      </main>
      <CommandPalette />
    </div>
  );
}

function titleFromSlug(slug: string) {
  const labels: Record<string, string> = {
    "jira-issues": "Jira Issues",
    "sprint-planning": "Sprint Planning",
    "meeting-intelligence": "Meeting Intelligence",
    "jira-settings": "Jira Connection Settings",
    "organization-settings": "Organization Settings",
    "ai-settings": "AI Settings",
    "security-settings": "Security Settings",
    "usage-audit": "Usage and Audit Logs",
    admin: "Admin Dashboard"
  };
  return labels[slug] ?? slug.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}
