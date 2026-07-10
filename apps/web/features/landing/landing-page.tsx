"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  DatabaseZap,
  GitPullRequestArrow,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const sections = [
  ["features", "Feature System", "Natural-language Jira workflows, sprint intelligence, approvals, memory, reports, and audit-ready tool activity."],
  ["ai-agents", "AI Agents", "Supervisor, Jira, Sprint Planning, Summarization, Risk, Memory, and Workflow agents collaborate behind one chat surface."],
  ["jira-integration", "Jira Integration", "OAuth architecture, read/write tools, webhook handling, token refresh, and demo-safe disconnected states."],
  ["security", "Security", "Human approval for writes, encrypted tokens, RBAC, organization isolation, audit logs, and prompt-injection resistance."],
  ["pricing", "Pricing Preview", "Portfolio-ready SaaS packaging with Team, Growth, and Enterprise plan scaffolding."],
  ["docs", "Documentation Preview", "Setup, architecture, OAuth, webhook, local demo, Docker, testing, and deployment instructions."],
  ["privacy", "Privacy", "Data is scoped by organization and sensitive tokens never reach the browser."],
  ["terms", "Terms", "Use SprintMind AI responsibly and verify AI recommendations before external actions."]
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-5">
        <Logo />
        <div className="ml-auto hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <Link href="/features">Features</Link>
          <Link href="/ai-agents">AI Agents</Link>
          <Link href="/jira-integration">Jira</Link>
          <Link href="/security">Security</Link>
        </div>
        <Button asChild variant="secondary">
          <Link href="/login">Sign in</Link>
        </Button>
      </nav>

      <section className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-10 px-5 pb-20 pt-8 lg:grid-cols-[1.04fr_0.96fr]">
        <div>
          <Badge tone="info">Multi-agent Jira workflow intelligence</Badge>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.02] md:text-7xl"
          >
            Turn every conversation into an intelligent project workflow.
          </motion.h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            SprintMind AI connects natural-language conversations with Jira, team knowledge, persistent memory, and autonomous project-management agents.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard?demo=1">
                Start Building Smarter
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/ai-chat?demo=1">Explore Interactive Demo</Link>
            </Button>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {["Approval-first writes", "Demo mode included", "Jira-ready backend"].map((item) => (
              <div key={item} className="rounded-lg border border-border bg-card/70 p-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mb-2 h-4 w-4 text-success" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="glass rounded-lg p-4"
        >
          <div className="rounded-lg border border-border bg-background/80 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-semibold">Sprint 12 Command</p>
                <p className="text-sm text-muted-foreground">AIP - Intelligent Workflow Release</p>
              </div>
              <Badge tone="warning">Needs approval</Badge>
            </div>
            <div className="mt-5 space-y-3">
              <ChatBubble role="User" text="Summarize the sprint and create Jira tasks for every unresolved blocker." />
              <ChatBubble
                role="SprintMind"
                text="3 blockers were identified. I prepared 4 Jira tasks and need your approval before creation."
                accent
              />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ["Understanding request", "complete"],
                ["Searching Jira issues", "complete"],
                ["Running risk analysis", "complete"],
                ["Waiting for approval", "active"]
              ].map(([label, state]) => (
                <div key={label} className="flex items-center gap-3 rounded-md border border-border bg-card p-3 text-sm">
                  <span className={state === "active" ? "h-2.5 w-2.5 rounded-full bg-warning" : "h-2.5 w-2.5 rounded-full bg-success"} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 md:grid-cols-3">
        <Feature icon={Bot} title="Multi-agent reasoning" text="Specialist agents collaborate without exposing hidden chain-of-thought." />
        <Feature icon={ShieldCheck} title="Human approval" text="Sensitive Jira write actions pause and wait for explicit confirmation." />
        <Feature icon={Brain} title="Persistent memory" text="Project rules, team ownership, and decisions stay visible and editable." />
        <Feature icon={Workflow} title="Workflow timeline" text="Every run displays stages, tools, approvals, retries, and final evidence." />
        <Feature icon={DatabaseZap} title="Semantic documents" text="Meeting notes and docs are validated, chunked, indexed, and cited." />
        <Feature icon={Network} title="Jira architecture" text="OAuth, webhooks, cache reconciliation, read tools, and write tools are wired." />
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="flex flex-col justify-center">
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Workflow graph</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">Supervisor-led execution</h2>
          <p className="mt-3 text-muted-foreground">
            Requests are routed to the right specialist, validated, attached to evidence, and paused before external writes.
          </p>
          <div className="mt-6 grid gap-3 text-sm">
            {["Intent detection", "Evidence retrieval", "Tool validation", "Human approval gate"].map((step) => (
              <div key={step} className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                <CheckCircle2 className="h-4 w-4 text-success" />
                {step}
              </div>
            ))}
          </div>
        </Card>
        <AgentWorkflowGraph />
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 md:grid-cols-2">
        <ProductPanel title="Meeting to Jira" icon={Zap} text="Upload transcript, extract action items, draft Jira tasks, edit, approve, and execute." />
        <ProductPanel title="Sprint Analytics" icon={Sparkles} text="Burndown, risk trend, workload, velocity, cycle time, and AI automation activity." />
        <ProductPanel title="Risk Detection" icon={ShieldCheck} text="Find blockers, overdue issues, dependencies, and likely sprint-completion threats." />
        <ProductPanel title="Security & Audit" icon={LockKeyhole} text="RBAC, token encryption, request IDs, workflow traces, and organization isolation." />
      </section>

      <footer className="border-t border-border px-5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center">
          <Logo />
          <p className="text-sm text-muted-foreground md:ml-auto">Built as a portfolio-grade AI engineering product.</p>
        </div>
      </footer>
    </main>
  );
}

function ChatBubble({ role, text, accent = false }: { role: string; text: string; accent?: boolean }) {
  return (
    <div className={accent ? "rounded-lg border border-accent/30 bg-accent/10 p-3" : "rounded-lg border border-border bg-card p-3"}>
      <p className="text-xs font-medium text-muted-foreground">{role}</p>
      <p className="mt-1 text-sm">{text}</p>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof Bot; title: string; text: string }) {
  return (
    <Card className="transition hover:-translate-y-1 hover:border-accent/40">
      <Icon className="h-5 w-5 text-accent" />
      <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </Card>
  );
}

function ProductPanel({ icon: Icon, title, text }: { icon: typeof Zap; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <Icon className="h-5 w-5 text-accent" />
      <h3 className="mt-4 font-display text-2xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{text}</p>
    </div>
  );
}

function AgentWorkflowGraph() {
  const agents = [
    {
      title: "Jira Agent",
      status: "searching issues",
      icon: Network,
      className: "md:col-start-1",
      tone: "border-accent/35 bg-accent/10"
    },
    {
      title: "Sprint Planning",
      status: "checking capacity",
      icon: Workflow,
      className: "md:col-start-2",
      tone: "border-primary/35 bg-primary/10"
    },
    {
      title: "Risk Analysis",
      status: "scoring blockers",
      icon: ShieldCheck,
      className: "md:col-start-1",
      tone: "border-warning/35 bg-warning/10"
    },
    {
      title: "Summarization",
      status: "drafting answer",
      icon: Sparkles,
      className: "md:col-start-2",
      tone: "border-success/35 bg-success/10"
    },
    {
      title: "Memory Agent",
      status: "retrieving rules",
      icon: Brain,
      className: "md:col-start-1",
      tone: "border-violet-400/35 bg-violet-400/10"
    },
    {
      title: "Workflow Agent",
      status: "approval pause",
      icon: GitPullRequestArrow,
      className: "md:col-start-2",
      tone: "border-danger/35 bg-danger/10"
    }
  ];

  return (
    <div className="glass relative overflow-hidden rounded-lg p-4">
      <div className="absolute inset-0 opacity-50 mesh-line" />
      <div className="relative min-h-[470px] md:h-[470px]">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full md:block"
          preserveAspectRatio="none"
          viewBox="0 0 680 470"
        >
          <defs>
            <linearGradient id="workflow-spine" x1="340" x2="340" y1="108" y2="406" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(var(--accent))" />
              <stop offset="0.52" stopColor="hsl(var(--primary))" />
              <stop offset="1" stopColor="hsl(var(--warning))" />
            </linearGradient>
            <linearGradient id="workflow-branch" x1="278" x2="402" y1="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(var(--accent) / 0.08)" />
              <stop offset="0.5" stopColor="hsl(var(--accent) / 0.55)" />
              <stop offset="1" stopColor="hsl(var(--accent) / 0.08)" />
            </linearGradient>
          </defs>
          <path d="M340 108V406" fill="none" stroke="url(#workflow-spine)" strokeLinecap="round" strokeWidth="2" />
          <path d="M278 168H402" fill="none" stroke="url(#workflow-branch)" strokeLinecap="round" strokeWidth="1.5" />
          <path d="M278 248H402" fill="none" stroke="hsl(var(--warning) / 0.45)" strokeLinecap="round" strokeWidth="1.5" />
          <path d="M278 328H402" fill="none" stroke="hsl(var(--primary) / 0.45)" strokeLinecap="round" strokeWidth="1.5" />
          <circle cx="340" cy="108" fill="hsl(var(--accent))" r="3" />
          <circle cx="340" cy="406" fill="hsl(var(--warning))" r="3" />
        </svg>

        <div className="relative z-10 mx-auto w-full max-w-[280px] rounded-lg border border-accent/40 bg-background p-4 text-center shadow-glow md:absolute md:left-1/2 md:top-0 md:-translate-x-1/2">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-md bg-accent/10">
            <Bot className="h-5 w-5 text-accent" />
          </div>
          <p className="mt-3 font-display text-lg font-semibold">Supervisor</p>
          <p className="mt-1 text-xs text-muted-foreground">routes request and enforces policy</p>
        </div>

        <div className="relative z-10 mt-8 grid gap-4 md:absolute md:left-0 md:right-0 md:top-[136px] md:mt-0 md:grid-cols-2 md:gap-x-28 md:gap-y-4">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <div key={agent.title} className={`relative rounded-lg border bg-background p-4 md:h-16 ${agent.tone} ${agent.className}`}>
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-card">
                    <Icon className="h-5 w-5 text-accent" />
                  </span>
                  <div>
                    <p className="font-medium">{agent.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{agent.status}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 mx-auto mt-7 w-full max-w-[360px] rounded-lg border border-warning/40 bg-warning/10 p-4 text-center md:absolute md:bottom-0 md:left-1/2 md:mt-0 md:-translate-x-1/2">
          <p className="font-medium text-warning">Human approval gate</p>
          <p className="mt-1 text-xs text-muted-foreground">external Jira writes wait here until the user approves</p>
        </div>
      </div>
    </div>
  );
}

export function PublicInfoPage({ slug }: { slug: string }) {
  const item = sections.find(([key]) => key === slug);
  if (!item || slug === "not-found") {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <Card className="max-w-xl text-center">
          <Logo className="justify-center" />
          <h1 className="mt-6 font-display text-3xl font-semibold">Page not found</h1>
          <p className="mt-3 text-muted-foreground">This route is not part of the SprintMind AI product map.</p>
          <Button asChild className="mt-6">
            <Link href="/dashboard?demo=1">Open demo</Link>
          </Button>
        </Card>
      </main>
    );
  }
  return (
    <main className="min-h-screen px-5 py-6">
      <nav className="mx-auto flex max-w-6xl items-center">
        <Logo />
        <Button asChild className="ml-auto" variant="secondary">
          <Link href="/">Home</Link>
        </Button>
      </nav>
      <section className="mx-auto mt-16 max-w-4xl">
        <Badge tone="info">SprintMind AI</Badge>
        <h1 className="mt-5 font-display text-5xl font-semibold">{item[1]}</h1>
        <p className="mt-5 text-xl leading-8 text-muted-foreground">{item[2]}</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {["Loaded", "Empty", "Error", "Permission denied"].map((state) => (
            <Card key={state}>
              <p className="font-medium">{state} state</p>
              <p className="mt-2 text-sm text-muted-foreground">This product area includes a designed {state.toLowerCase()} state in the authenticated app shell.</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
