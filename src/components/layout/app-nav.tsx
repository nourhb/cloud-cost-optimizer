"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  FileUp,
  LayoutDashboard,
  Lightbulb,
  Menu,
  PiggyBank,
  FileText,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/imports", label: "Imports", icon: FileUp },
  { href: "/analysis", label: "Analysis", icon: BarChart3 },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/reports", label: "Reports", icon: FileText },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="App">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "justify-start gap-2",
              active && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          Cloud Cost Optimizer
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <NavLinks />
      </div>
      <div className="border-t border-sidebar-border p-3 text-xs text-muted-foreground">
        Demo session · CAD
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <div className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
      <Link href="/dashboard" className="font-semibold tracking-tight">
        Cloud Cost Optimizer
      </Link>
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="outline" size="icon-sm" aria-label="Open menu">
              <Menu className="size-4" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b border-border px-4 py-3 text-left">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="p-3">
            <NavLinks />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
