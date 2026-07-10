import {
  Activity,
  Bell,
  Bot,
  CalendarClock,
  Gauge,
  KanbanSquare,
  LibraryBig,
  Search,
  ShieldCheck,
  Workflow,
  Zap
} from "lucide-react";

export const shellActions = [
  { label: "Create new conversation", href: "/ai-chat", icon: Bot },
  { label: "Create Jira issue", href: "/ai-chat", icon: Zap },
  { label: "Open current sprint", href: "/sprint-board", icon: KanbanSquare },
  { label: "Summarize sprint", href: "/ai-chat", icon: Activity },
  { label: "Import meeting notes", href: "/meeting-intelligence", icon: CalendarClock },
  { label: "Start workflow", href: "/workflows", icon: Workflow },
  { label: "Search issues", href: "/jira-issues", icon: Search },
  { label: "Switch project", href: "/projects", icon: LibraryBig },
  { label: "Open notifications", href: "/notifications", icon: Bell },
  { label: "Open security settings", href: "/security-settings", icon: ShieldCheck },
  { label: "Open AI settings", href: "/ai-settings", icon: Gauge }
];

