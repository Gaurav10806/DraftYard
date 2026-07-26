import { Link } from "@tanstack/react-router";
import { Hexagon } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Hexagon className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">DraftYard</span>
        </Link>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}
