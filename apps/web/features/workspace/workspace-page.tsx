"use client";

import Link from "next/link";
import {
  Bell,
  BookOpen,
  Bot,
  CheckCircle2,
  Database,
  FileText,
  GitBranch,
  HardDriveUpload,
  LockKeyhole,
  Network,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Workflow
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const pageMeta: Record<string, { title: string; icon: typeof Bot; summary: string; actions: string[] }> = {
  projects: {
    title: "Projects",
    icon: GitBranch,
    summary: "Select Jira projects, inspect sync status, and scope AI answers by organization and project.",
    actions: ["Switch project", "Sync Jira", "Open project memory"]
  },
  "sprint-planning": {
    title: "Sprint Planning",
    icon: Workflow,
    summary: "Plan work from backlog context, workload, risk, dependencies, and team-memory signals.",
    actions: ["Draft sprint plan", "Balance workload", "Find duplicate backlog items"]
  },
  "meeting-intelligence": {
    title: "Meeting Intelligence",
    icon: HardDriveUpload,
    summary: "Upload transcripts, extract decisions, generate action items, and prepare Jira drafts for approval.",
    actions: ["Import notes", "Extract actions", "Create Jira drafts"]
  },
  reports: {
    title: "Reports",
    icon: FileText,
    summary: "Generate sprint summary, sprint health, risk, workload, stand-up, stakeholder, release, and AI usage reports.",
    actions: ["Generate report", "Download", "Copy stakeholder update"]
  },
  workflows: {
    title: "Workflows",
    icon: Workflow,
    summary: "Track workflow runs, approvals, retries, partial failures, tool calls, and execution history.",
    actions: ["Start workflow", "Review approvals", "Retry safe failure"]
  },
  memories: {
    title: "Memories",
    icon: Database,
    summary: "View, correct, pin, archive, delete, and mark project memory as inaccurate.",
    actions: ["Add memory", "Pin", "Archive"]
  },
  documents: {
    title: "Documents",
    icon: BookOpen,
    summary: "Validate uploads, process documents, create searchable chunks, and cite sources in answers.",
    actions: ["Upload document", "Search", "Delete"]
  },
  notifications: {
    title: "Notifications",
    icon: Bell,
    summary: "Track Jira sync events, blockers, approvals, workflow results, document processing, and sprint events.",
    actions: ["Mark all read", "Filter", "Open linked workflow"]
  },
  team: {
    title: "Team",
    icon: Users,
    summary: "Manage roles, permissions, responsibilities, workload, and reviewer ownership.",
    actions: ["Invite member", "Change role", "Review workload"]
  },
  integrations: {
    title: "Integrations",
    icon: Network,
    summary: "Connect Jira Cloud, inspect OAuth scopes, manage webhooks, and review integration health.",
    actions: ["Connect Jira", "Reconnect", "Disconnect"]
  },
  "jira-settings": {
    title: "Jira Connection Settings",
    icon: Network,
    summary: "Configure site selection, token refresh, webhook status, and scheduled reconciliation.",
    actions: ["Connect", "Test webhook", "Run sync"]
  },
  profile: {
    title: "User Profile",
    icon: Users,
    summary: "Manage account details, language preference, sessions, and notification preferences.",
    actions: ["Save profile", "Revoke session", "Update preferences"]
  },
  "organization-settings": {
    title: "Organization Settings",
    icon: SlidersHorizontal,
    summary: "Configure organization identity, roles, AI policy, approval thresholds, and data-retention rules.",
    actions: ["Save settings", "Manage roles", "Export audit"]
  },
  "ai-settings": {
    title: "AI Settings",
    icon: Bot,
    summary: "Choose model, tool access, memory behavior, response language, and developer metadata visibility.",
    actions: ["Save model", "Toggle tools", "Disable memory"]
  },
  "security-settings": {
    title: "Security Settings",
    icon: LockKeyhole,
    summary: "Review sessions, CSRF policy, token rotation, approval rules, and audit-log coverage.",
    actions: ["Revoke session", "Review policy", "Export logs"]
  },
  "usage-audit": {
    title: "Usage and Audit Logs",
    icon: ShieldCheck,
    summary: "Inspect request IDs, workflow runs, tool calls, Jira requests, token usage, retries, and failures.",
    actions: ["Filter logs", "Download CSV", "Open event"]
  },
  admin: {
    title: "Admin Dashboard",
    icon: ShieldCheck,
    summary: "Monitor organization health, users, integrations, rate limits, jobs, and operational risk.",
    actions: ["Review users", "Inspect jobs", "Open system health"]
  }
};

export function WorkspacePage({ section, detailId }: { section: string; detailId?: string }) {
  const meta = pageMeta[section] ?? pageMeta.projects;
  const Icon = meta.icon;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md border border-accent/30 bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </span>
              <div>
                <h2 className="font-display text-3xl font-semibold">{detailId ? "Workflow Run Details" : meta.title}</h2>
                <p className="text-sm text-muted-foreground">{detailId ? `Run ID: ${detailId}` : "NovaStack Labs / AIP"}</p>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-muted-foreground">{meta.summary}</p>
          </div>
          <div className="md:ml-auto flex flex-wrap gap-2">
            {meta.actions.slice(0, 2).map((action) => (
              <Button key={action} variant={action.includes("Delete") || action.includes("Disconnect") ? "danger" : "secondary"}>
                {action}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {[
          ["Populated", "Live demo data is available and scoped to the current organization.", "success"],
          ["Loading", "Skeleton and progress states are defined for network and worker activity.", "info"],
          ["Empty", "Helpful empty guidance is shown when no records exist.", "default"],
          ["Error", "Retry controls and safe explanations appear for failed requests.", "warning"]
        ].map(([title, text, tone]) => (
          <Card key={title}>
            <Badge tone={tone as "success" | "info" | "default" | "warning"}>{title}</Badge>
            <p className="mt-4 text-sm text-muted-foreground">{text}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h3 className="font-display text-xl font-semibold">Operational view</h3>
          <div className="mt-4 divide-y divide-border rounded-lg border border-border">
            {meta.actions.map((action) => (
              <div key={action} className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm font-medium">{action}</p>
                  <p className="text-xs text-muted-foreground">Permission-aware action wired for the {meta.title.toLowerCase()} workflow.</p>
                </div>
                <Button className="ml-auto" size="sm" variant="ghost">
                  Open
                </Button>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-display text-xl font-semibold">Permission and connection states</h3>
          <div className="mt-4 space-y-3">
            {["Permission denied", "Disconnected Jira", "Offline mode", "Rate limit", "Partial workflow failure"].map((state) => (
              <div key={state} className="rounded-md border border-border bg-background p-3 text-sm">
                <p className="font-medium">{state}</p>
                <p className="mt-1 text-xs text-muted-foreground">User-safe explanation, retry path, and audit-safe details are available.</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="font-display text-xl font-semibold">Next best action</h3>
            <p className="mt-1 text-sm text-muted-foreground">Use the AI Assistant to run this page workflow from natural language.</p>
          </div>
          <Button asChild className="md:ml-auto">
            <Link href="/ai-chat">Open AI Assistant</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
