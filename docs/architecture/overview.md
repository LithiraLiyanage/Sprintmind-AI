# Architecture Overview

SprintMind AI is organized around vertical product slices: authentication, Jira integration, conversations, agent runs, approvals, memory, documents, reporting, notifications, and audit logs.

The backend owns all sensitive actions. The browser never receives Jira tokens, refresh tokens, OpenAI keys, or workflow bypass permissions. AI-generated tool arguments are treated as proposals and validated by the backend before becoming approval requests or executed actions.

## Runtime flow

1. A user sends a message from the chat workspace.
2. The supervisor agent classifies intent and builds a safe execution plan.
3. Read-only tools can run immediately if the user has access.
4. Jira write tools create an approval request and pause the workflow.
5. After approval, the workflow resumes, revalidates permissions, executes the Jira tool, stores the result, and writes audit logs.
6. The UI displays streamed progress stages, tool activity, and final response evidence.

## Demo mode

Demo mode seeds a local organization, project, sprint, issues, workflow runs, memories, reports, and notifications. Demo mode is clearly labelled and never claims a real Jira action was executed.

