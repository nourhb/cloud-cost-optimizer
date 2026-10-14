import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthPlaceholderMessage } from "@/features/auth";
import { cn } from "@/lib/utils";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_#e8f3f0_0%,_#f7faf9_55%,_#eef2f7_100%)] px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-background/90 p-8 shadow-sm">
        <div className="space-y-1">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Cloud Cost Optimizer
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            {getAuthPlaceholderMessage()}
          </p>
        </div>

        <form className="space-y-4" action="/dashboard">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              defaultValue="demo@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              defaultValue="demo-password"
            />
          </div>
          <Button type="submit" className="w-full">
            Continue to app (demo)
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
