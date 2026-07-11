import { Link, useRouterState } from "@tanstack/react-router";

import {
  Boxes,
  Rss,
  RefreshCw,
  BarChart2,
  Layers,
  ClipboardCheck,
  Bot,
  UserCircle,
  Settings,
  Hexagon,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const primary = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Workspace", url: "#", icon: Boxes },
  { title: "DraftYard Feed", url: "#", icon: Rss },
  { title: "Revival Board", url: "#", icon: RefreshCw },
  { title: "Insights", url: "#", icon: BarChart2 },
  { title: "Stack Intelligence", url: "#", icon: Layers },
  { title: "Idea Review", url: "#", icon: ClipboardCheck },
  { title: "AI Assistant", url: "#", icon: Bot },
  { title: "Profile", url: "#", icon: UserCircle },
  { title: "Settings", url: "#", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Hexagon className="h-4 w-4" strokeWidth={2.2} />
          </span>
          {!collapsed && <span className="font-display text-base font-semibold">DraftYard</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1 scrollbar-none scroll-smooth sidebar-fade-y [-webkit-overflow-scrolling:touch] overscroll-contain pb-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {primary.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="group/link relative h-9 transition-colors duration-[180ms] ease-out data-[active=true]:bg-sidebar-accent/70"
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-[220ms] ease-out ${
                            active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50"
                          }`}
                        />
                        <item.icon className={`h-4 w-4 shrink-0 transition-colors duration-[180ms] ${active ? "text-primary" : "group-hover/link:text-foreground"}`} />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-4">
            <p className="font-display text-sm font-semibold leading-tight">Big ideas<br/>start here.</p>
            <p className="mt-1 text-xs text-muted-foreground">Capture today,<br/>build tomorrow.</p>
            <Link to="/new-draft">
              <Button size="sm" className="mt-3 w-full rounded-lg">
                <Plus className="mr-1 h-3.5 w-3.5" /> New Draft
              </Button>
            </Link>
          </div>
        ) : (
          <Link to="/new-draft">
            <Button size="icon" className="rounded-lg">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
