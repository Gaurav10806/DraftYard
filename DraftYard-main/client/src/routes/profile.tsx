import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  MapPin,
  Github,
  Linkedin,
  Globe,
  Pencil,
  Share2,
  FolderKanban,
  CheckCircle2,
  RefreshCw,
  Users,
  UserPlus,
  UserCheck,
  MoreHorizontal,
  ExternalLink,
  FilePlus,
  Rocket,
  GitBranch,
  X,
  Search,
} from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateUserProfile, type UserProfile } from "@/lib/api";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · DraftYard" },
      {
        name: "description",
        content:
          "Your DraftYard developer profile — projects, skills, network, and activity.",
      },
      { property: "og:title", content: "DraftYard Profile" },
      {
        property: "og:description",
        content: "Developer profile with public projects, skills, and network.",
      },
    ],
  }),
  component: ProfilePage,
});

// ---------------- Seed data ----------------

const USER = {
  name: "Gaurav Soni",
  username: "gauravsoni",
  plan: "Pro Member",
  bio: "Full Stack Developer passionate about building products that solve real world problems.",
  location: "Ahmedabad, India",
  github: "github.com/Gaurav10806",
  linkedin: "linkedin.com/in/gaurav-soni",
  portfolio: "gauravsoni.dev",
  initials: "GS",
};

const STATS = [
  { key: "projects", label: "Projects", value: 12, icon: FolderKanban, tint: "amber" },
  { key: "completed", label: "Completed", value: 4, icon: CheckCircle2, tint: "emerald" },
  { key: "revived", label: "Revived", value: 3, icon: RefreshCw, tint: "violet" },
  { key: "collabs", label: "Collaborations", value: 8, icon: Users, tint: "sky" },
  { key: "followers", label: "Followers", value: 156, icon: UserPlus, tint: "rose" },
  { key: "following", label: "Following", value: 89, icon: UserCheck, tint: "indigo" },
] as const;

const SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "MongoDB",
  "Express.js", "Python", "Docker", "Git", "Tailwind CSS",
  "PostgreSQL", "Next.js",
];

type ProjectStatus = "Building" | "Completed" | "On Hold";

const PROJECTS: {
  name: string;
  description: string;
  status: ProjectStatus;
  stack: string[];
  updated: string;
  icon: string;
  tint: string;
}[] = [
  {
    name: "StudyBuddy",
    description: "AI study companion for students",
    status: "Building",
    stack: ["React", "Node.js", "MongoDB"],
    updated: "Updated 2 days ago",
    icon: "SB",
    tint: "violet",
  },
  {
    name: "DevCollab",
    description: "Developer collaboration platform",
    status: "Completed",
    stack: ["Next.js", "TypeScript", "PostgreSQL"],
    updated: "Updated 1 week ago",
    icon: "DC",
    tint: "emerald",
  },
  {
    name: "TradeTrack",
    description: "Stock market tracking dashboard",
    status: "On Hold",
    stack: ["React", "Redux", "Chart.js"],
    updated: "Updated 2 weeks ago",
    icon: "TT",
    tint: "amber",
  },
];

const NETWORK = {
  following: [
    { name: "Aditya Lodhiya", handle: "@adityalodhiya", role: "Full Stack Developer", initials: "AL", state: "Following" as const },
    { name: "Ansh Vekariya", handle: "@anshvekariya", role: "Backend Developer", initials: "AV", state: "Following" as const },
    { name: "Nidhi Seta", handle: "@nidhiseta", role: "Mentor", initials: "NS", state: "Follow" as const },
  ],
  followers: [
    { name: "Rahul Mehta", handle: "@rahulmehta", role: "Frontend Engineer", initials: "RM", state: "Follow" as const },
    { name: "Priya Shah", handle: "@priyashah", role: "Product Designer", initials: "PS", state: "Following" as const },
    { name: "Karan Patel", handle: "@karanpatel", role: "DevOps Engineer", initials: "KP", state: "Follow" as const },
  ],
  mutual: [
    { name: "Aditya Lodhiya", handle: "@adityalodhiya", role: "Full Stack Developer", initials: "AL", state: "Following" as const },
    { name: "Priya Shah", handle: "@priyashah", role: "Product Designer", initials: "PS", state: "Following" as const },
  ],
};

const ACTIVITY = [
  { icon: FilePlus, label: "Created a new draft", target: "AI Code Review Tool", time: "2 days ago", tint: "violet" },
  { icon: RefreshCw, label: "Revived a project", target: "StudyBuddy", time: "1 week ago", tint: "sky" },
  { icon: GitBranch, label: "Started collaboration on", target: "DevCollab", time: "2 weeks ago", tint: "emerald" },
  { icon: Rocket, label: "Published project", target: "DevCollab", time: "3 weeks ago", tint: "amber" },
];

// ---------------- Small helpers ----------------

const tintBg: Record<string, string> = {
  violet: "bg-violet-500/12 text-violet-500",
  emerald: "bg-emerald-500/12 text-emerald-500",
  amber: "bg-amber-500/12 text-amber-500",
  sky: "bg-sky-500/12 text-sky-500",
  rose: "bg-rose-500/12 text-rose-500",
  indigo: "bg-indigo-500/12 text-indigo-500",
};

const statusStyle: Record<ProjectStatus, string> = {
  Building: "bg-violet-500/12 text-violet-500 border border-violet-500/20",
  Completed: "bg-emerald-500/12 text-emerald-500 border border-emerald-500/20",
  "On Hold": "bg-amber-500/15 text-amber-500 border border-amber-500/25",
};

// ---------------- Page ----------------

function ProfilePage() {
  const [modal, setModal] = useState<null | "followers" | "following">(null);
  const [profileModal, setProfileModal] = useState(false);
  const [tab, setTab] = useState<"following" | "followers" | "mutual">("following");
  const [query, setQuery] = useState("");
  const [profileData, setProfileData] = useState<UserProfile>({
    fullName: USER.name,
    username: USER.username,
    bio: USER.bio,
    github: USER.github,
    linkedin: USER.linkedin,
    portfolio: USER.portfolio,
  });
  const [saving, setSaving] = useState(false);

  console.log("Profile page mounted");

  const isProfileMissing = !Boolean(profileData.fullName?.trim()) || !Boolean(profileData.username?.trim());

  const handleEditClick = () => {
    setProfileModal(true);
  };

  const handleProfileSave = async () => {
    if (!profileData.fullName || !profileData.username) {
      toast.error("Full Name and Username are required");
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({
        fullName: profileData.fullName,
        username: profileData.username,
        bio: profileData.bio,
        github: profileData.github,
        linkedin: profileData.linkedin,
        portfolio: profileData.portfolio,
      });
      toast.success("Profile updated successfully!");
      setProfileModal(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const list = NETWORK[tab];
  const filtered = list.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.handle.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <TopBar showGreeting={false} />

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
              <h1 className="font-display text-2xl font-semibold tracking-tight">Profile</h1>

              {/* -------- HEADER CARD -------- */}
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  <div className="relative shrink-0">
                    <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500/25 to-primary/20 ring-4 ring-background">
                      <Avatar className="h-28 w-28">
                        <AvatarImage src="" alt={USER.name} />
                        <AvatarFallback className="bg-transparent text-2xl font-semibold text-primary">
                          {USER.initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card bg-emerald-500" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="font-display text-2xl font-semibold tracking-tight">{USER.name}</h2>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">@{USER.username}</span>
                          <Badge className="border-primary/25 bg-primary/12 text-primary hover:bg-primary/15">
                            {USER.plan}
                          </Badge>
                        </div>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                          {USER.bio}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" /> {USER.location}
                          </span>
                          <a href={`https://${USER.github}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
                            <Github className="h-4 w-4" /> {USER.github}
                          </a>
                          <a href={`https://${USER.linkedin}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
                            <Linkedin className="h-4 w-4" /> {USER.linkedin}
                          </a>
                          <a href={`https://${USER.portfolio}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
                            <Globe className="h-4 w-4" /> {USER.portfolio}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleEditClick}>
                          <Pencil className="h-3.5 w-3.5" /> Edit Profile
                        </Button>
                        <Button size="sm" className="gap-1.5">
                          <Share2 className="h-3.5 w-3.5" /> Share Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {STATS.map((s) => {
                    const clickable = s.key === "followers" || s.key === "following";
                    const onClick = () => {
                      if (s.key === "followers") { setTab("followers"); setModal("followers"); }
                      if (s.key === "following") { setTab("following"); setModal("following"); }
                    };
                    return (
                      <button
                        key={s.key}
                        onClick={clickable ? onClick : undefined}
                        className={`flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3 py-3 text-left transition-colors ${clickable ? "hover:border-primary/40 hover:bg-primary/[0.03]" : ""}`}
                        type="button"
                        disabled={!clickable}
                      >
                        <span className={`grid h-9 w-9 place-items-center rounded-lg ${tintBg[s.tint]}`}>
                          <s.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {s.label}
                          </div>
                          <div className="font-display text-xl font-semibold leading-none">
                            {s.value}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* -------- PROJECTS + SKILLS/NETWORK -------- */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Public Projects */}
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold">Public Projects</h3>
                    <Link to="/workspace" search={{ draftId: undefined }} className="text-xs font-medium text-primary hover:underline">
                      View all
                    </Link>
                  </div>
                  <div className="flex flex-col gap-3">
                    {PROJECTS.map((p) => (
                      <div
                        key={p.name}
                        className="group flex items-start gap-3 rounded-xl border border-border bg-background/50 p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
                      >
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-semibold ${tintBg[p.tint]}`}>
                          {p.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">{p.name}</div>
                              <div className="truncate text-xs text-muted-foreground">{p.description}</div>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle[p.status]}`}>
                              {p.status}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {p.stack.map((t) => (
                              <span key={t} className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {t}
                              </span>
                            ))}
                            <span className="ml-auto text-[10px] text-muted-foreground">{p.updated}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Link to="/workspace" search={{ draftId: undefined }} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      View all projects <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </section>

                {/* Skills + Network stacked */}
                <div className="flex flex-col gap-6">
                  <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="mb-4 font-display text-base font-semibold">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.map((s) => (
                        <span
                          key={s}
                          className="rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground/85 transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-base font-semibold">Network</h3>
                      <button
                        onClick={() => setModal("following")}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View all
                      </button>
                    </div>

                    <div className="mb-4 flex items-center gap-1 rounded-lg border border-border bg-background/40 p-1 text-xs">
                      {(["following", "followers", "mutual"] as const).map((t) => {
                        const count = NETWORK[t].length === 0 ? 0 : t === "following" ? 89 : t === "followers" ? 156 : 23;
                        return (
                          <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 rounded-md px-2 py-1.5 font-medium capitalize transition-colors ${
                              tab === t ? "bg-primary/12 text-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {t} ({count})
                          </button>
                        );
                      })}
                    </div>

                    <ul className="flex flex-col gap-3">
                      {list.map((u) => (
                        <li key={u.handle} className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/12 text-[11px] font-semibold text-primary">
                              {u.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{u.name}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              <span className="text-muted-foreground/70">{u.handle}</span>
                              <span className="mx-1.5">·</span>
                              {u.role}
                            </div>
                          </div>
                          <Button
                            variant={u.state === "Following" ? "outline" : "default"}
                            size="sm"
                            className="h-7 px-3 text-xs"
                          >
                            {u.state}
                          </Button>
                          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>

              {/* -------- RECENT ACTIVITY -------- */}
              <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="mb-5 font-display text-base font-semibold">Recent Activity</h3>
                <ol className="relative grid gap-6 md:grid-cols-4">
                  <div className="absolute left-4 right-4 top-4 hidden h-px bg-border md:block" />
                  {ACTIVITY.map((a, i) => (
                    <li key={i} className="relative flex gap-3 md:flex-col md:gap-3">
                      <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-card ${tintBg[a.tint]}`}>
                        <a.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">{a.label}</div>
                        <div className="mt-0.5 truncate text-sm font-medium">"{a.target}"</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">{a.time}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* -------- FOLLOWERS / FOLLOWING MODAL -------- */}
      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="font-display text-lg">
              {modal === "followers" ? "Followers" : "Following"}
            </DialogTitle>
          </DialogHeader>

          <div className="border-b border-border p-4">
            <div className="mb-3 flex items-center gap-1 rounded-lg border border-border bg-background/40 p-1 text-xs">
              {(["following", "followers", "mutual"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-md px-2 py-1.5 font-medium capitalize transition-colors ${
                    tab === t ? "bg-primary/12 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or handle…"
                className="rounded-lg bg-background pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <ul className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">No results.</li>
            )}
            {filtered.map((u) => (
              <li key={u.handle} className="flex items-center gap-3 rounded-lg p-2 hover:bg-background/60">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/12 text-[11px] font-semibold text-primary">
                    {u.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{u.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {u.handle} · {u.role}
                  </div>
                </div>
                <Button
                  variant={u.state === "Following" ? "outline" : "default"}
                  size="sm"
                  className="h-7 px-3 text-xs"
                >
                  {u.state}
                </Button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setModal(null)}
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogContent>
      </Dialog>

      {/* -------- PROFILE EDIT MODAL -------- */}
      <Dialog open={profileModal} onOpenChange={setProfileModal}>
        <DialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-xl sm:rounded-2xl">
          <DialogHeader className="relative">
            <button
              onClick={() => setProfileModal(false)}
              className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <DialogTitle className="font-display text-xl font-semibold">Edit Profile</DialogTitle>
          </DialogHeader>

          {isProfileMissing && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-sm text-amber-700 dark:text-amber-200">
                Complete your profile to unlock all DraftYard features.
              </p>
            </div>
          )}

          <div className="space-y-4 py-4">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                placeholder="Your full name"
                value={profileData.fullName || ""}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                className="rounded-lg border border-border/60 bg-background/50"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Username *</label>
              <Input
                placeholder="Your username"
                value={profileData.username || ""}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                className="rounded-lg border border-border/60 bg-background/50"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                placeholder="Tell us about yourself..."
                value={profileData.bio || ""}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="min-h-20 rounded-lg border border-border/60 bg-background/50 text-sm"
              />
            </div>

            {/* GitHub */}
            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub URL</label>
              <Input
                placeholder="github.com/username"
                value={profileData.github || ""}
                onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
                className="rounded-lg border border-border/60 bg-background/50"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <label className="text-sm font-medium">LinkedIn URL</label>
              <Input
                placeholder="linkedin.com/in/username"
                value={profileData.linkedin || ""}
                onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                className="rounded-lg border border-border/60 bg-background/50"
              />
            </div>

            {/* Portfolio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Portfolio Website</label>
              <Input
                placeholder="yoursite.com"
                value={profileData.portfolio || ""}
                onChange={(e) => setProfileData({ ...profileData, portfolio: e.target.value })}
                className="rounded-lg border border-border/60 bg-background/50"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setProfileModal(false)}
              className="flex-1 rounded-lg"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProfileSave}
              className="flex-1 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
