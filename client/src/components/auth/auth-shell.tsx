import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTheme } from "@/lib/use-theme";

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
  const { theme } = useTheme();
  const faviconSrc = theme === "dark" ? "/favicon_dark.png" : "/favicon.png";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <img
  src={theme === "dark"
    ? `/favicon_dark.png?v=${theme}`
    : `/favicon.png?v=${theme}`}
            alt="DraftYard" 
            className="h-9 w-9 shrink-0 rounded-lg"
          />
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
