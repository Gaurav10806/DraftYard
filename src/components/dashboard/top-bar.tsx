import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <header className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {greeting}, Dev <span className="inline-block">👋</span>
          </h1>
          <p className="text-sm text-muted-foreground">Let's turn your ideas into incredible projects.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search drafts, people, resources…" className="rounded-full bg-card pl-9 pr-14" />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
        </div>
        <ThemeToggle />
        <button className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">4</span>
        </button>
        <Avatar className="h-9 w-9 ring-2 ring-border">
          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">DY</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
