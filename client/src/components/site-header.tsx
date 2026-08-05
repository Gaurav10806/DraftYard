import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/use-theme";

export function SiteHeader() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const faviconSrc = theme === "dark" ? "/favicon_dark.png" : "/favicon.png";

  const initials = getInitials(user?.name, user?.email);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img
  src={theme === "dark"
    ? `/favicon_dark.png?v=${theme}`
    : `/favicon.png?v=${theme}`} 
            alt="DraftYard" 
            className="h-9 w-9 shrink-0 rounded-lg"
          />
          <span className="font-display text-lg font-semibold tracking-tight">DraftYard</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link
            to="/"
            className="hover:text-foreground transition-colors"
            activeProps={{ className: "text-foreground" }}
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            className="hover:text-foreground transition-colors"
            activeProps={{ className: "text-foreground" }}
          >
            Dashboard
          </Link>
          <a href="#how" className="hover:text-foreground transition-colors">
            How it works
          </a>
          <a href="#insights" className="hover:text-foreground transition-colors">
            Insights
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isLoading ? null : isAuthenticated ? (
            <>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button>
                    <Avatar className="h-9 w-9 ring-2 ring-border transition-shadow hover:ring-primary/50">
                      <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="truncate">{user?.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      toast("Signed out");
                      navigate({ to: "/" });
                    }}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
