import { LogoMark } from "@/components/layout/logo";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-glow">
        <LogoMark loading />
        <span className="text-sm text-muted-foreground">Loading SprintMind AI</span>
      </div>
    </main>
  );
}

