import type { ReactNode } from "react";
import { AppSidebar, MobileNav } from "@/components/layout/app-nav";
import { DemoBanner } from "@/components/shared/demo-banner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <DemoBanner />
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
