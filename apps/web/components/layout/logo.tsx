import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ loading = false }: { loading?: boolean }) {
  return (
    <span className="relative grid h-10 w-10 place-items-center rounded-md border border-accent/30 bg-accent/10">
      {loading ? <span className="absolute inset-0 rounded-md border border-accent/50 animate-pulse-ring" /> : null}
      <Image src="/brand/icon.svg" alt="" width={28} height={28} priority />
    </span>
  );
}

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      {!compact ? (
        <div>
          <p className="font-display text-base font-semibold leading-none">SprintMind AI</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Plan. Track. Summarize. Automate.</p>
        </div>
      ) : null}
    </div>
  );
}

