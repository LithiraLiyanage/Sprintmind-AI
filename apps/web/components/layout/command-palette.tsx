"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shellActions } from "@/lib/navigation";
import { useUiStore } from "@/stores/ui-store";

export function CommandPalette() {
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="glass fixed left-1/2 top-20 z-50 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg p-4 shadow-premium">
          <div className="flex items-center gap-3">
            <Dialog.Title className="font-display text-lg font-semibold">Command palette</Dialog.Title>
            <Dialog.Close asChild>
              <Button className="ml-auto" variant="ghost" size="icon" aria-label="Close command palette">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <Input className="mt-4" autoFocus placeholder="Search commands, Jira issues, reports, settings..." />
          <div className="mt-4 grid gap-2">
            {shellActions.map((action) => {
              const Icon = action.icon;
              return (
                <Dialog.Close asChild key={action.label}>
                  <Link
                    href={action.href}
                    className="flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </Link>
                </Dialog.Close>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
