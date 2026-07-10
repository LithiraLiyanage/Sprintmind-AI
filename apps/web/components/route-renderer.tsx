"use client";

import { AuthPage } from "@/features/auth/auth-page";
import { ChatPage } from "@/features/chat/chat-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { LandingPage, PublicInfoPage } from "@/features/landing/landing-page";
import { SprintBoardPage } from "@/features/sprint-board/sprint-board-page";
import { WorkspacePage } from "@/features/workspace/workspace-page";
import { AppShell } from "@/components/layout/app-shell";

const authRoutes = new Set(["login", "register", "forgot-password", "reset-password"]);
const publicRoutes = new Set(["features", "ai-agents", "jira-integration", "security", "pricing", "docs", "privacy", "terms"]);
const workspaceRoutes = new Set([
  "dashboard",
  "ai-chat",
  "conversations",
  "projects",
  "jira-issues",
  "sprint-board",
  "sprint-planning",
  "meeting-intelligence",
  "reports",
  "workflows",
  "memories",
  "documents",
  "notifications",
  "team",
  "integrations",
  "jira-settings",
  "profile",
  "organization-settings",
  "ai-settings",
  "security-settings",
  "usage-audit",
  "admin"
]);

export function RouteRenderer({ path }: { path: string[] }) {
  const slug = path[0] ?? "";
  if (!slug) return <LandingPage />;
  if (authRoutes.has(slug)) return <AuthPage mode={slug} />;
  if (publicRoutes.has(slug)) return <PublicInfoPage slug={slug} />;
  if (!workspaceRoutes.has(slug)) return <PublicInfoPage slug="not-found" />;

  let content = <WorkspacePage section={slug} detailId={path[1]} />;
  if (slug === "dashboard") content = <DashboardPage />;
  if (slug === "ai-chat" || slug === "conversations") content = <ChatPage />;
  if (slug === "sprint-board" || slug === "jira-issues") content = <SprintBoardPage section={slug} />;

  return <AppShell active={slug}>{content}</AppShell>;
}

