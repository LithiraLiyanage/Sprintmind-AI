import type { ChatMessage, DashboardPayload, JiraIssue } from "@/types/domain";

export const demoDashboard: DashboardPayload = {
  organization: "NovaStack Labs",
  project: {
    id: "demo-project",
    key: "AIP",
    name: "AI Platform Modernization",
    sprint: "Sprint 12 - Intelligent Workflow Release"
  },
  lastSync: new Date().toISOString(),
  jiraConnection: "demo_disconnected",
  metrics: {
    sprintProgress: 42,
    completedIssues: 5,
    inProgressIssues: 5,
    blockedIssues: 4,
    overdueIssues: 3,
    openRisks: 6,
    teamUtilization: 82,
    aiWorkflowsCompleted: 2,
    statusDistribution: [
      { name: "To Do", value: 4 },
      { name: "In Progress", value: 5 },
      { name: "In Review", value: 3 },
      { name: "Blocked", value: 4 },
      { name: "Done", value: 4 }
    ],
    workload: [
      { name: "Lithira", issues: 5 },
      { name: "Senithi", issues: 4 },
      { name: "Nimal", issues: 4 },
      { name: "Ayesha", issues: 4 },
      { name: "Kasun", issues: 3 }
    ],
    burndown: [
      { day: "Mon", remaining: 24, ideal: 24 },
      { day: "Tue", remaining: 21, ideal: 20 },
      { day: "Wed", remaining: 18, ideal: 16 },
      { day: "Thu", remaining: 15, ideal: 12 },
      { day: "Fri", remaining: 11, ideal: 8 }
    ]
  },
  insight: "The sprint can still land if the team clears OAuth, webhook, and validation blockers before taking new scope.",
  criticalBlockers: [
    { key: "AIP-104", summary: "Add encrypted Jira OAuth token storage", assignee: "Kasun Fernando", risk: 0.88 },
    { key: "AIP-107", summary: "Add pgvector-backed memory retrieval", assignee: "Lithira Liyanage", risk: 0.88 },
    { key: "AIP-110", summary: "Add webhook deduplication for Jira issue updates", assignee: "Ayesha Silva", risk: 0.88 }
  ],
  activeWorkflows: [
    { id: "wf-demo-1", name: "Meeting notes to Jira tasks", status: "waiting_for_approval", summary: "3 task drafts are waiting." },
    { id: "wf-demo-2", name: "Daily stand-up summary", status: "completed", summary: "Stand-up summary generated." }
  ],
  pendingApprovals: [{ id: "ap-demo-1", workflowId: "wf-demo-1", title: "Create 3 Jira task drafts" }],
  recentNotifications: [
    { id: "n1", title: "Approval required", body: "3 Jira task drafts are waiting.", type: "workflow_approval_required" },
    { id: "n2", title: "New blocker detected", body: "AIP-104 is blocked.", type: "new_blocker_detected" }
  ],
  recentConversations: [
    { id: "c1", title: "Sprint 12 risk review", mode: "supervisor", updatedAt: new Date().toISOString() },
    { id: "c2", title: "Meeting notes to Jira", mode: "workflow", updatedAt: new Date().toISOString() }
  ]
};

export const demoMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "Demo mode is active. Ask me to summarize the sprint, find blockers, convert meeting notes to Jira drafts, or remember a project rule.",
    metadata: {
      stages: ["Ready"],
      agents: ["Supervisor", "Jira Agent", "Memory Agent"]
    }
  }
];

export const demoIssues: JiraIssue[] = [
  {
    id: "1",
    key: "AIP-104",
    type: "Task",
    summary: "Add encrypted Jira OAuth token storage",
    status: "Blocked",
    priority: "Critical",
    assignee: "Kasun Fernando",
    storyPoints: 5,
    dueDate: new Date().toISOString(),
    labels: ["security", "oauth"],
    riskScore: 0.88
  },
  {
    id: "2",
    key: "AIP-107",
    type: "Task",
    summary: "Add pgvector-backed memory retrieval",
    status: "In Progress",
    priority: "High",
    assignee: "Lithira Liyanage",
    storyPoints: 8,
    dueDate: new Date().toISOString(),
    labels: ["ai", "memory"],
    riskScore: 0.72
  },
  {
    id: "3",
    key: "AIP-110",
    type: "Bug",
    summary: "Add webhook deduplication for Jira issue updates",
    status: "In Review",
    priority: "High",
    assignee: "Ayesha Silva",
    storyPoints: 3,
    dueDate: new Date().toISOString(),
    labels: ["webhook"],
    riskScore: 0.66
  },
  {
    id: "4",
    key: "AIP-116",
    type: "Task",
    summary: "Add command palette actions",
    status: "Done",
    priority: "Medium",
    assignee: "Nimal Perera",
    storyPoints: 2,
    dueDate: new Date().toISOString(),
    labels: ["frontend"],
    riskScore: 0.18
  }
];

