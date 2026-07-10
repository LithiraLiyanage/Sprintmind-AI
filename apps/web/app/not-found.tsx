import Link from "next/link";
import { LogoMark } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass max-w-xl rounded-lg p-8 text-center">
        <div className="mx-auto mb-5 flex justify-center">
          <LogoMark />
        </div>
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">That SprintMind route does not exist or is not available in this workspace.</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
      </div>
    </main>
  );
}

