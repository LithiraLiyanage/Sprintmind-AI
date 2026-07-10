import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "danger" | "info" }) {
  const tones = {
    default: "border-border bg-muted text-muted-foreground",
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    danger: "border-danger/30 bg-danger/10 text-danger",
    info: "border-accent/30 bg-accent/10 text-accent"
  };
  return <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}
