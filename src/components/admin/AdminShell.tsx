import type { ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  Banknote,
  Receipt,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/hooks/useAdminSession";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { to: "/applications", label: "Demandes", icon: FileText },
  { to: "/loans", label: "Prêts", icon: Banknote },
  { to: "/repayments", label: "Remboursements", icon: Receipt },
  { to: "/rules", label: "Règles de prêt", icon: SlidersHorizontal },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const { admin, email } = useAdminSession();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    await router.navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <p className="font-display text-lg font-semibold text-sidebar-accent-foreground">
            Zender<span className="text-sidebar-primary">237</span>
          </p>
          <p className="text-xs text-sidebar-foreground/70">Back-office · Module Prêt</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary",
              }}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-4">
          <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
            {admin?.full_name ?? "Administrateur"}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/70">{email ?? ""}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="mt-3 w-full justify-start text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" /> Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 overflow-x-auto border-b border-border bg-card px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium whitespace-nowrap"
              activeProps={{
                className:
                  "rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap bg-primary text-primary-foreground border border-primary",
              }}
            >
              {item.label}
            </Link>
          ))}
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}
    >
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
