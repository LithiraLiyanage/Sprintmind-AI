"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { demoLogin } from "@/lib/api";

const authCopy: Record<string, { title: string; subtitle: string }> = {
  login: { title: "Welcome back", subtitle: "Sign in to continue to SprintMind AI." },
  register: { title: "Create your workspace", subtitle: "Start with demo data, then connect Jira when ready." },
  "forgot-password": { title: "Reset access", subtitle: "Enter your email and we will prepare a reset flow." },
  "reset-password": { title: "Choose a new password", subtitle: "Set a strong password for this workspace." }
};

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(12).optional(),
  confirmPassword: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function AuthPage({ mode }: { mode: string }) {
  const copy = authCopy[mode] ?? authCopy.login;
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "demo@sprintmind.ai", password: "SprintMind!2026" }
  });

  async function continueDemo() {
    await demoLogin().catch(() => undefined);
    toast.success("Demo mode ready");
    router.push(next);
  }

  async function submit(values: FormValues) {
    if (mode === "forgot-password" || mode === "reset-password") {
      toast.info("Password recovery UI is wired. Backend email delivery can be added with your provider.");
      return;
    }
    if (values.email === "demo@sprintmind.ai") {
      await continueDemo();
      return;
    }
    toast.message("Use demo mode locally, or connect the backend registration endpoint with SMTP in production.");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[0.94fr_1.06fr]">
      <section className="hidden border-r border-border p-8 lg:flex lg:flex-col">
        <Logo />
        <div className="mt-auto max-w-xl">
          <p className="font-display text-5xl font-semibold leading-tight">Natural-language project operations, protected by approval.</p>
          <p className="mt-5 text-lg text-muted-foreground">Demo workspace includes seeded Jira-like issues, memories, reports, workflows, approvals, and notifications.</p>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <Card className="w-full max-w-md">
          <Logo compact />
          <h1 className="mt-8 font-display text-3xl font-semibold">{copy.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(submit)}>
            {mode === "register" ? (
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <UserRound className="h-4 w-4" />
                  Name
                </span>
                <Input {...register("name")} placeholder="Lithira Liyanage" />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </span>
              <Input {...register("email")} type="email" />
              {errors.email ? <p className="mt-1 text-xs text-danger">{errors.email.message}</p> : null}
            </label>
            {mode !== "forgot-password" ? (
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <LockKeyhole className="h-4 w-4" />
                  Password
                </span>
                <Input {...register("password")} type="password" />
                {errors.password ? <p className="mt-1 text-xs text-danger">{errors.password.message}</p> : null}
              </label>
            ) : null}
            {mode === "register" || mode === "reset-password" ? (
              <label className="block">
                <span className="mb-2 text-sm text-muted-foreground">Confirm password</span>
                <Input {...register("confirmPassword")} type="password" />
              </label>
            ) : null}
            <Button className="w-full" disabled={isSubmitting}>
              {mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <Button className="mt-3 w-full" variant="secondary" onClick={continueDemo}>
            Continue in demo mode
          </Button>
          <div className="mt-5 flex justify-between text-sm text-muted-foreground">
            <Link href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Create account" : "Sign in"}</Link>
            <Link href="/forgot-password">Forgot password</Link>
          </div>
        </Card>
      </section>
    </main>
  );
}

