"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock,
  Gauge,
  GitPullRequestArrow,
  ListChecks,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboard } from "@/lib/api";
import { demoDashboard } from "@/lib/demo-data";
import { percent } from "@/lib/utils";

const metricIcons = [Gauge, CheckCircle2, Clock, ShieldAlert, CalendarClock, AlertTriangle, Users, Bot];
const palette = ["#4F7CFF", "#22D3EE", "#22C55E", "#F59E0B", "#8B5CF6", "#EF4444"];

export function DashboardPage() {
  const { data = demoDashboard, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard
  });

  const metricCards = [
    ["Sprint progress", percent(data.metrics.sprintProgress), "Current sprint completion"],
    ["Completed", data.metrics.completedIssues, "Issues finished"],
    ["In progress", data.metrics.inProgressIssues, "Currently active"],
    ["Blocked", data.metrics.blockedIssues, "Needs intervention"],
    ["Overdue", data.metrics.overdueIssues, "Past due date"],
    ["Open risks", data.metrics.openRisks, "Risk score over threshold"],
    ["Utilization", percent(data.metrics.teamUtilization), "Team capacity"],
    ["AI workflows", data.metrics.aiWorkflowsCompleted, "Completed automations"]
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-muted-foreground">Good morning, Lithira</p>
            <h2 className="font-display text-3xl font-semibold">{data.project.sprint}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.organization} / {data.project.key} - Last sync {new Date(data.lastSync).toLocaleString()}
            </p>
          </div>
          <div className="md:ml-auto flex flex-wrap items-center gap-2">
            <Badge tone="warning">Demo Jira disconnected</Badge>
            <Badge tone="info">Memory on</Badge>
            <Button variant="secondary" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {isError ? (
        <Card className="border-danger/40">
          <p className="font-medium text-danger">Dashboard API error</p>
          <p className="mt-2 text-sm text-muted-foreground">Showing local demo data. Start the backend to use persisted data.</p>
        </Card>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(([label, value, help], index) => {
          const Icon = metricIcons[index];
          return (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Card className={isLoading ? "animate-pulse" : ""}>
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-accent" />
                  <span className="text-xs text-muted-foreground">{help}</span>
                </div>
                <p className="mt-5 text-3xl font-semibold">{value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </Card>
            </motion.div>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold">Burndown</h3>
              <p className="text-sm text-muted-foreground">Remaining issues against ideal progress.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.metrics.burndown}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" />
                <XAxis dataKey="day" stroke="currentColor" />
                <YAxis stroke="currentColor" />
                <Tooltip contentStyle={{ background: "#0D1426", border: "1px solid rgba(148,163,184,0.18)" }} />
                <Line type="monotone" dataKey="remaining" stroke="#22D3EE" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="ideal" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-xl font-semibold">Issue status</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.metrics.statusDistribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96}>
                  {data.metrics.statusDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0D1426", border: "1px solid rgba(148,163,184,0.18)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h3 className="font-display text-xl font-semibold">Team workload</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.metrics.workload}>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" />
                <XAxis dataKey="name" stroke="currentColor" />
                <YAxis stroke="currentColor" />
                <Tooltip contentStyle={{ background: "#0D1426", border: "1px solid rgba(148,163,184,0.18)" }} />
                <Bar dataKey="issues" fill="#4F7CFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="font-display text-xl font-semibold">AI sprint insight</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{data.insight}</p>
          <div className="mt-5 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.metrics.burndown}>
                <defs>
                  <linearGradient id="risk" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area dataKey="remaining" stroke="#F59E0B" fill="url(#risk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Critical blockers
          </h3>
          <div className="mt-4 space-y-3">
            {data.criticalBlockers.map((issue) => (
              <div key={issue.key} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone="danger">{issue.key}</Badge>
                  <span className="text-xs text-muted-foreground">Risk {Math.round(issue.risk * 100)}%</span>
                </div>
                <p className="mt-2 text-sm font-medium">{issue.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">{issue.assignee}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold">
            <GitPullRequestArrow className="h-5 w-5 text-accent" />
            Active workflows
          </h3>
          <div className="mt-4 space-y-3">
            {data.activeWorkflows.map((workflow) => (
              <div key={workflow.id} className="rounded-md border border-border bg-background p-3">
                <Badge tone={workflow.status.includes("approval") ? "warning" : "success"}>{workflow.status}</Badge>
                <p className="mt-2 text-sm font-medium">{workflow.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{workflow.summary}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold">
            <ListChecks className="h-5 w-5 text-success" />
            Recommended actions
          </h3>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>Review pending Jira task drafts before creating external issues.</p>
            <p>Prioritize AIP-104 and AIP-107 before adding new sprint scope.</p>
            <p>Generate stakeholder update after blockers move out of blocked state.</p>
          </div>
        </Card>
      </section>
    </div>
  );
}

