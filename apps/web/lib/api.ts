import { demoDashboard, demoIssues } from "@/lib/demo-data";
import type { DashboardPayload, JiraIssue } from "@/types/domain";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Envelope<T> = { data: T; meta?: Record<string, unknown> };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  const payload = (await response.json()) as Envelope<T>;
  return payload.data;
}

export async function demoLogin() {
  return request("/api/v1/auth/demo", { method: "POST" });
}

export async function getDashboard(): Promise<DashboardPayload> {
  try {
    return await request<DashboardPayload>("/api/v1/dashboard");
  } catch {
    return demoDashboard;
  }
}

export async function getIssues(): Promise<JiraIssue[]> {
  try {
    return await request<JiraIssue[]>("/api/v1/jira/issues");
  } catch {
    return demoIssues;
  }
}

export async function createConversation(): Promise<{ id: string; title: string }> {
  try {
    return await request<{ id: string; title: string }>("/api/v1/conversations", { method: "POST" });
  } catch {
    return { id: "local-demo-conversation", title: "Local demo conversation" };
  }
}

export async function sendMessage(conversationId: string, content: string) {
  try {
    return await request<{
      userMessageId: string;
      assistantMessageId: string;
      response: string;
      metadata: Record<string, unknown>;
    }>(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content })
    });
  } catch {
    const write = /create|move|update|assign|jira|meeting/i.test(content);
    return {
      userMessageId: crypto.randomUUID(),
      assistantMessageId: crypto.randomUUID(),
      response: write
        ? "I prepared Jira action drafts, but I did not execute them. Approval is required before any Jira write action runs."
        : "Sprint 12 has 4 blockers, 3 overdue issues, and the highest risk is around OAuth, webhook, and memory retrieval work.",
      metadata: {
        stages: ["Understanding request", "Retrieving project context", "Preparing recommendations", write ? "Waiting for approval" : "Completed"],
        agents: ["Supervisor", "Jira Agent", "Risk Analysis Agent", "Memory Agent"],
        workflowId: write ? "wf-local-demo" : undefined,
        approvalId: write ? "ap-local-demo" : undefined,
        demoMode: true
      }
    };
  }
}

export async function approveWorkflow(workflowId: string) {
  if (workflowId === "wf-local-demo") {
    return { id: workflowId, status: "completed" };
  }
  return request(`/api/v1/workflows/${workflowId}/approve`, { method: "POST" });
}

