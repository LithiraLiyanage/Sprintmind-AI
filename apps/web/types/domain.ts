export type MetricSet = {
  sprintProgress: number;
  completedIssues: number;
  inProgressIssues: number;
  blockedIssues: number;
  overdueIssues: number;
  openRisks: number;
  teamUtilization: number;
  aiWorkflowsCompleted: number;
  statusDistribution: Array<{ name: string; value: number }>;
  workload: Array<{ name: string; issues: number }>;
  burndown: Array<{ day: string; remaining: number; ideal: number }>;
};

export type DashboardPayload = {
  organization: string;
  project: { id: string; key: string; name: string; sprint: string };
  lastSync: string;
  jiraConnection: "connected" | "disconnected" | "demo_disconnected";
  metrics: MetricSet;
  insight: string;
  criticalBlockers: Array<{ key: string; summary: string; assignee: string; risk: number }>;
  activeWorkflows: Array<{ id: string; name: string; status: string; summary: string }>;
  pendingApprovals: Array<{ id: string; workflowId: string; title: string }>;
  recentNotifications: Array<{ id: string; title: string; body: string; type: string }>;
  recentConversations: Array<{ id: string; title: string; mode: string; updatedAt: string }>;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  type?: string;
  metadata?: {
    stages?: string[];
    agents?: string[];
    toolCalls?: Array<Record<string, unknown>>;
    workflowId?: string;
    approvalId?: string;
    demoMode?: boolean;
    intent?: string;
  };
};

export type JiraIssue = {
  id: string;
  key: string;
  type: string;
  summary: string;
  status: string;
  priority: string;
  assignee: string;
  storyPoints: number;
  dueDate: string;
  labels: string[];
  riskScore: number;
};

