import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Search, Settings, UserCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { drafts } from "@/data/drafts";
import { slugify } from "@/routes/project.$slug";

const NOTIFICATIONS = [
  {
    id: 1,
    title: "New comment on StudyBuddy",
    detail: "AK left feedback on your calendar UI",
    time: "12m ago",
  },
  {
    id: 2,
    title: "GigMap marked open for revival",
    detail: "3 contributors are interested",
    time: "2h ago",
  },
  { id: 3, title: "Teammate joined your draft", detail: "RP accepted your invite", time: "5h ago" },
  {
    id: 4,
    title: "Weekly digest is ready",
    detail: "See what happened across DraftYard",
    time: "1d ago",
  },
];

export function TopBar() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("Good afternoon");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [unread, setUnread] = useState(NOTIFICATIONS.length);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  // ⌘K / Ctrl+K focuses the search box
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = query.trim()
    ? drafts
        .filter((d) => d.projectName.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  const goToDraft = (name: string) => {
    navigate({ to: "/project/$slug", params: { slug: slugify(name) } });
    setQuery("");
    inputRef.current?.blur();
  };

  const submitSearch = () => {
    if (results.length > 0) {
      goToDraft(results[0].projectName);
    } else if (query.trim()) {
      toast(`No drafts found for "${query.trim()}"`);
    }
  };

  return (
    <header className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight">
            {greeting}, Dev_Cosmos! <span className="inline-block">👋</span>
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Let's turn your ideas into incredible projects.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="group relative w-72 transition-[width] duration-[220ms] ease-out focus-within:w-96 focus-within:max-w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onKeyDown={(e) => e.key === "Enter" && submitSearch()}
            placeholder="Search drafts, people, resources…"
            className="rounded-full bg-card pl-9 pr-14 transition-shadow duration-[220ms] focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
          />
          {!query && (
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          )}

          {focused && query.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              {results.length > 0 ? (
                results.map((d) => (
                  <button
                    key={d.projectName}
                    onMouseDown={() => goToDraft(d.projectName)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/60"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-[10px] font-bold text-primary">
                      {d.projectName.slice(0, 2)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{d.projectName}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {d.oneLiner}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No drafts match "{query}"
                </div>
              )}
            </div>
          )}
        </div>

        <ThemeToggle />

        <DropdownMenu onOpenChange={(open) => open && setUnread(0)}>
          <DropdownMenuTrigger asChild>
            <button className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                  {unread}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {NOTIFICATIONS.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex flex-col items-start gap-0.5 whitespace-normal py-2"
              >
                <span className="text-sm font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.detail}</span>
                <span className="text-[10px] text-muted-foreground">{n.time}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>
              <Avatar className="h-9 w-9 ring-2 ring-border transition-shadow hover:ring-primary/50">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  DY
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Dev_Cosmos</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => toast("Profile page is on the roadmap — not built yet")}
            >
              <UserCircle className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toast("Settings page is on the roadmap — not built yet")}
            >
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => toast("Signed out (demo only — no auth wired up yet)")}
            >
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
