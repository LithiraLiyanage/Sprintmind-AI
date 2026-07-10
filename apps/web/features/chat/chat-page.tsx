"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  CircleStop,
  Clipboard,
  FileUp,
  GitPullRequestArrow,
  Mic,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  RefreshCcw,
  Send,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  Workflow
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { approveWorkflow, createConversation, sendMessage } from "@/lib/api";
import { demoMessages } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import type { ChatMessage } from "@/types/domain";

const suggestions = [
  "Summarize the active sprint",
  "Find blockers and dependencies",
  "Show overdue issues",
  "Balance team workload",
  "Convert meeting notes into tasks",
  "Generate a stakeholder update",
  "Review the backlog",
  "Create release notes"
];

const slashCommands = [
  "/sprint-summary",
  "/create-issue",
  "/risk-report",
  "/standup",
  "/meeting-to-jira",
  "/backlog-review",
  "/find-blockers",
  "/team-workload",
  "/release-notes",
  "/remember"
];

export function ChatPage() {
  const [conversationId, setConversationId] = useState("local-demo-conversation");
  const [messages, setMessages] = useState<ChatMessage[]>(demoMessages);
  const [composer, setComposer] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const rightOpen = useUiStore((state) => state.rightPanelOpen);
  const toggleRight = useUiStore((state) => state.toggleRightPanel);

  useEffect(() => {
    void createConversation().then((conversation) => setConversationId(conversation.id));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const latestMetadata = useMemo(() => [...messages].reverse().find((message) => message.metadata)?.metadata, [messages]);

  const mutation = useMutation({
    mutationFn: async (content: string) => sendMessage(conversationId, content),
    onMutate: (content) => {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "user", content },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Working through the request...",
          metadata: { stages: ["Understanding request"], agents: ["Supervisor"] }
        }
      ]);
    },
    onSuccess: (data) => {
      setMessages((current) => [
        ...current.slice(0, -1),
        {
          id: data.assistantMessageId,
          role: "assistant",
          content: data.response,
          type: data.metadata.approvalId ? "approval_request" : "text",
          metadata: data.metadata as ChatMessage["metadata"]
        }
      ]);
      if (data.metadata.approvalId) toast.warning("Approval required before Jira write actions run.");
    },
    onError: () => {
      toast.error("Message failed. Local demo fallback is still available.");
    }
  });

  function submit(content = composer) {
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error("Message cannot be empty.");
      return;
    }
    setComposer("");
    mutation.mutate(trimmed);
  }

  async function approve(workflowId: string) {
    await approveWorkflow(workflowId);
    toast.success("Workflow approved in demo mode");
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "system",
        content: "Workflow approved. Demo mode completed the run without creating real Jira issues.",
        metadata: { stages: ["Approval received", "Executing approved actions", "Completed"] }
      }
    ]);
  }

  return (
    <div className={cn("grid gap-4", rightOpen ? "xl:grid-cols-[280px_minmax(0,1fr)_340px]" : "xl:grid-cols-[280px_minmax(0,1fr)]")}>
      <aside className="hidden rounded-lg border border-border bg-card p-3 xl:block">
        <Button className="w-full">
          <Sparkles className="h-4 w-4" />
          New conversation
        </Button>
        <div className="mt-4 space-y-2">
          {["Sprint 12 risk review", "Meeting notes to Jira", "Webhook dedupe plan"].map((title, index) => (
            <button
              key={title}
              className={cn(
                "w-full rounded-md border px-3 py-3 text-left text-sm transition hover:bg-muted",
                index === 0 ? "border-accent/40 bg-accent/10" : "border-border"
              )}
            >
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">Supervisor mode</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[calc(100vh-124px)] flex-col rounded-lg border border-border bg-card">
        <header className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Sprint 12 risk review</h2>
            <p className="text-sm text-muted-foreground">Supervisor mode / AIP / memory active</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge tone="info">Agent ready</Badge>
            <Button variant="ghost" size="icon" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Export">
              <Clipboard className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="More">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleRight} aria-label="Toggle context panel">
              {rightOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn("mb-4 flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role !== "user" ? <Avatar icon={message.role === "system" ? Workflow : Bot} /> : null}
                <div className={cn("max-w-[760px] rounded-lg border p-4", message.role === "user" ? "border-primary/30 bg-primary/10" : "border-border bg-background")}>
                  <div className="max-w-none text-sm leading-6">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  {message.metadata?.stages ? <StageList stages={message.metadata.stages} /> : null}
                  {message.metadata?.approvalId && message.metadata.workflowId ? (
                    <ApprovalCard workflowId={message.metadata.workflowId} onApprove={approve} />
                  ) : null}
                  {message.role === "assistant" ? (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                      <Button variant="ghost" size="sm">
                        <Clipboard className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                      <Button variant="ghost" size="sm">
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Regenerate
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>
                {message.role === "user" ? <Avatar icon={UserRound} /> : null}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {suggestions.slice(0, 5).map((prompt) => (
              <button
                key={prompt}
                className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:border-accent hover:text-foreground"
                onClick={() => submit(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <Textarea
              value={composer}
              onChange={(event) => setComposer(event.target.value)}
              placeholder="Ask SprintMind AI about sprints, blockers, Jira issues, meetings, memory, or reports..."
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
            />
            {composer.startsWith("/") ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {slashCommands.filter((command) => command.startsWith(composer)).map((command) => (
                  <button key={command} onClick={() => setComposer(command + " ")} className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                    {command}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Attach file">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Upload meeting transcript">
                <FileUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Voice input preview">
                <Mic className="h-4 w-4" />
              </Button>
              <Badge tone="info">~{Math.max(1, Math.ceil(composer.length / 4))} tokens</Badge>
              <Button className="ml-auto" variant="secondary" disabled={!mutation.isPending}>
                <CircleStop className="h-4 w-4" />
                Stop
              </Button>
              <Button onClick={() => submit()} disabled={mutation.isPending}>
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </section>

      {rightOpen ? <ContextPanel metadata={latestMetadata} /> : null}
    </div>
  );
}

function Avatar({ icon: Icon }: { icon: typeof Bot }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-muted">
      <Icon className="h-4 w-4 text-accent" />
    </span>
  );
}

function StageList({ stages }: { stages: string[] }) {
  return (
    <div className="mt-3 grid gap-2">
      {stages.map((stage, index) => (
        <div key={`${stage}-${index}`} className="flex items-center gap-2 text-xs text-muted-foreground">
          {index === stages.length - 1 && /Waiting|Working/.test(stage) ? (
            <span className="h-2 w-2 rounded-full bg-warning" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          )}
          {stage}
        </div>
      ))}
    </div>
  );
}

function ApprovalCard({ workflowId, onApprove }: { workflowId: string; onApprove: (workflowId: string) => Promise<void> }) {
  const [open, setOpen] = useState(true);
  return (
    <Card className="mt-4 border-warning/40 bg-warning/5">
      <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen((value) => !value)}>
        <span>
          <span className="block font-medium">Approval required</span>
          <span className="text-xs text-muted-foreground">Jira write operations are paused until approval.</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 transition", !open && "-rotate-90")} />
      </button>
      {open ? (
        <div className="mt-4 space-y-3">
          {["Create Jira issue draft", "Validate fields and permissions", "Write audit-log entry"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-sm">
              <GitPullRequestArrow className="h-4 w-4 text-warning" />
              {item}
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={() => onApprove(workflowId)}>
              <CheckCircle2 className="h-4 w-4" />
              Approve demo run
            </Button>
            <Button variant="secondary">Reject</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ContextPanel({ metadata }: { metadata?: ChatMessage["metadata"] }) {
  const tabs = ["Context", "Agents", "Tools", "Sources", "Jira", "Memory", "Workflow"];
  const [tab, setTab] = useState("Agents");
  return (
    <aside className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Context & activity</h3>
        <Badge tone="info">Live</Badge>
      </div>
      <div className="mt-4 flex gap-1 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item}
            className={cn("rounded-md px-2 py-1 text-xs transition", tab === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {tab === "Agents"
          ? (metadata?.agents ?? ["Supervisor", "Jira Agent", "Sprint Planning Agent", "Risk Analysis Agent", "Memory Agent", "Workflow Agent"]).map((agent, index) => (
              <div key={agent} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{agent}</p>
                  <Badge tone={index === 0 ? "success" : "info"}>{index === 0 ? "complete" : "ready"}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Duration {180 + index * 80}ms / result summary available.</p>
              </div>
            ))
          : null}
        {tab === "Tools"
          ? (metadata?.toolCalls?.length ? metadata.toolCalls : [{ tool: "jira.search_issues", summary: "Read sprint issues", approval: "not required" }]).map((tool, index) => (
              <div key={index} className="rounded-md border border-border bg-background p-3 text-sm">
                <p className="font-medium">{String(tool.tool ?? "tool.call")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{String(tool.summary ?? "Executed safely in demo mode.")}</p>
              </div>
            ))
          : null}
        {tab === "Memory" ? (
          <div className="rounded-md border border-border bg-background p-3 text-sm">
            <p className="font-medium">Team responsibility</p>
            <p className="mt-1 text-muted-foreground">Lithira handles AI and backend-related work.</p>
          </div>
        ) : null}
        {!["Agents", "Tools", "Memory"].includes(tab) ? (
          <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
            {tab} evidence is available when the active workflow uses that source.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
