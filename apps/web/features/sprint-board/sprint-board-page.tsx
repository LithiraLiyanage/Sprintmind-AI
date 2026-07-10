"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarDays, GripVertical, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getIssues } from "@/lib/api";
import { demoIssues } from "@/lib/demo-data";
import type { JiraIssue } from "@/types/domain";

const columns = ["To Do", "In Progress", "In Review", "Blocked", "Done"];

export function SprintBoardPage({ section }: { section: string }) {
  const { data = demoIssues } = useQuery({ queryKey: ["issues"], queryFn: getIssues });
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => data.filter((issue) => `${issue.key} ${issue.summary} ${issue.assignee}`.toLowerCase().includes(query.toLowerCase())),
    [data, query]
  );

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold">{section === "jira-issues" ? "Jira Issues" : "Sprint Board"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Demo Jira data is mapped into visual categories. Live Jira workflows can differ and should be mapped dynamically.
            </p>
          </div>
          <div className="lg:ml-auto flex flex-wrap gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issues" />
            </div>
            <Button variant="secondary">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 overflow-x-auto pb-2 xl:grid-cols-5">
        {columns.map((column) => {
          const issues = filtered.filter((issue) => issue.status === column || (column === "To Do" && !columns.includes(issue.status)));
          return (
            <div key={column} className="min-h-[520px] min-w-[260px] rounded-lg border border-border bg-card p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">{column}</h3>
                <Badge tone={column === "Blocked" ? "danger" : "default"}>{issues.length}</Badge>
              </div>
              <div className="space-y-3">
                {issues.length ? (
                  issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
                ) : (
                  <div className="rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground">No issues in this category.</div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function IssueCard({ issue }: { issue: JiraIssue }) {
  const riskTone = issue.riskScore > 0.75 ? "danger" : issue.riskScore > 0.55 ? "warning" : "info";
  return (
    <Card className="p-3 transition hover:-translate-y-0.5 hover:border-accent/40">
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{issue.key}</Badge>
            <Badge tone={riskTone}>Risk {Math.round(issue.riskScore * 100)}%</Badge>
          </div>
          <p className="mt-3 text-sm font-medium leading-5">{issue.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{issue.assignee}</span>
            <span>SP {issue.storyPoints}</span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(issue.dueDate).toLocaleDateString()}
            </span>
          </div>
          {issue.status === "Blocked" ? (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 p-2 text-xs text-danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              Status changes require Jira approval.
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

