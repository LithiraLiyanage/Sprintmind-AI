"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass max-w-xl rounded-lg p-8 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-danger">500</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">Something broke</h1>
        <p className="mt-3 text-muted-foreground">The page failed to render. Retry once, then check the API and browser console.</p>
        <Button className="mt-6" onClick={reset}>
          Retry
        </Button>
      </div>
    </main>
  );
}

