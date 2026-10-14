import Link from "next/link";
import { ArrowRight, Shield, Upload, LineChart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isDemoMode } from "@/lib/env";

export default function LandingPage() {
  const demo = isDemoMode();

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,_#e8f3f0_0%,_#f7faf9_45%,_#eef2f7_100%)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="text-sm font-semibold tracking-tight text-foreground">
          Cloud Cost Optimizer
        </div>
        <div className="flex items-center gap-2">
          {demo ? (
            <Badge variant="secondary">Demo mode</Badge>
          ) : null}
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Open app
          </Link>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-20 pt-10 sm:px-6">
        <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute -left-16 bottom-10 h-56 w-56 rounded-full bg-slate-300/30 blur-3xl" />

        <div className="relative max-w-2xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-800/80">
            FinOps visibility
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Cloud Cost Optimizer
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Import billing CSVs, understand where spend goes, set budgets with
            clear alerts, and get recommendations you can explain — without
            destructive cloud operations.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              Explore the app
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Create account
            </Link>
          </div>
        </div>

        <ul className="relative mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Upload,
              title: "Import billing data",
              body: "Validate CSV columns, catch duplicates, and keep an import history.",
            },
            {
              icon: LineChart,
              title: "See spend clearly",
              body: "Dashboards and charts by service, region, and environment.",
            },
            {
              icon: Shield,
              title: "Advise, never destroy",
              body: "Recommendations stay consultative. No delete, stop, or resize actions.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="space-y-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-white/80 text-teal-800 shadow-sm ring-1 ring-slate-200/80">
                <Icon className="size-4" aria-hidden />
              </div>
              <h2 className="font-medium text-slate-900">{title}</h2>
              <p className="text-sm leading-relaxed text-slate-600">{body}</p>
            </li>
          ))}
        </ul>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/50 px-4 py-4 text-center text-xs text-slate-500 sm:px-6">
        Milestone 1 scaffold · Local demo runs on port 43123
      </footer>
    </div>
  );
}
