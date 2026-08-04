import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
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
  Plus,
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
import { updateUserProfile, fetchUserProfile, fetchPublicUserProfile, followUser, unfollowUser, fetchFollowers, fetchFollowing, fetchUserCollaborations, fetchUserSuggestions, addSkill, removeSkill, type UserProfile, type PublicUser } from "@/lib/api";
import { useMyDrafts } from "@/hooks/use-drafts";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

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

// ACTIVITY is now derived dynamically from real user data in ProfilePage

// ---------------- Small helpers ----------------

function getTimeSince(date: Date | null | undefined): string {
  if (!date) return "recently";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function getTintForProject(domain: string): string {
  const tints: Record<string, string> = {
    web: "violet",
    mobile: "sky",
    backend: "emerald",
    ai: "amber",
    design: "rose",
  };
  return tints[domain] || "indigo";
}

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
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: myDrafts, isLoading: draftsLoading } = useMyDrafts();
  // Use router to read search params (userId)
  const router = useRouter();
  const search = router.latestLocation?.search ?? {};
  const publicUserId = (search as Record<string, string>).userId as string | undefined;
  
  // Determine if we're in owner or public mode
  const isOwnerProfile = !publicUserId;
  
  const { data: fetchedProfile, isLoading: profileLoading, refetch } = useQuery({
    queryKey: publicUserId ? ["public-profile", publicUserId] : ["user-profile"],
    queryFn: publicUserId ? () => fetchPublicUserProfile(publicUserId) : fetchUserProfile,
    enabled: publicUserId ? true : !!authUser,
  });

  // Fetch followers and following (only for owner or logged in user)
  const { data: followersData = [] } = useQuery({
    queryKey: ["followers"],
    queryFn: fetchFollowers,
    enabled: isOwnerProfile && !!authUser,
  });

  const { data: followingData = [] } = useQuery({
    queryKey: ["following"],
    queryFn: fetchFollowing,
    enabled: isOwnerProfile && !!authUser,
  });

  // Fetch user collaborations (only for owner)
  const { data: collaborationsData = [] } = useQuery({
    queryKey: ["collaborations"],
    queryFn: fetchUserCollaborations,
    enabled: isOwnerProfile && !!authUser,
  });

  // Fetch user suggestions (only for owner)
  const { data: suggestionsData = [] } = useQuery({
    queryKey: ["user-suggestions"],
    queryFn: fetchUserSuggestions,
    enabled: isOwnerProfile && !!authUser,
  });

  const [modal, setModal] = useState<null | "followers" | "following">(null);
  const [profileModal, setProfileModal] = useState(false);
  const [tab, setTab] = useState<"following" | "followers" | "mutual">("following");
  const [query, setQuery] = useState("");
  
  // Initialize profile data from fetched profile or defaults
  const [profileData, setProfileData] = useState<UserProfile>({
    fullName: "",
    username: "",
    bio: "",
    github: "",
    linkedin: "",
    portfolio: "",
  });
  
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [pendingSkills, setPendingSkills] = useState<string[]>([]);
  const [showSkillInput, setShowSkillInput] = useState(false);

  // Skill mutations
  const addSkillMutation = useMutation({
    mutationFn: addSkill,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["user-profile"], updatedUser);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeSkillMutation = useMutation({
    mutationFn: removeSkill,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["user-profile"], updatedUser);
      toast.success("Skill removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Add a chip to the pending list (from input)
  const commitInputToChip = () => {
    const raw = skillInput.trim().replace(/,+$/, "").trim();
    if (!raw) return;
    // Split by comma in case user typed "python, java"
    const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
    const existing = fetchedProfile?.skills ?? [];
    const newOnes = parts.filter(p => !existing.includes(p) && !pendingSkills.includes(p));
    if (newOnes.length) setPendingSkills(prev => [...prev, ...newOnes]);
    setSkillInput("");
  };

  // Save all pending chips to the DB
  const handleSaveSkills = async () => {
    if (!pendingSkills.length) return;
    for (const skill of pendingSkills) {
      await addSkillMutation.mutateAsync(skill);
    }
    setPendingSkills([]);
    setShowSkillInput(false);
    toast.success(`${pendingSkills.length > 1 ? `${pendingSkills.length} skills` : "Skill"} added!`);
  };

  const removePendingSkill = (skill: string) =>
    setPendingSkills(prev => prev.filter(s => s !== skill));

  // Update profile data when fetched profile changes
  useEffect(() => {
    if (fetchedProfile) {
      setProfileData({
        fullName: fetchedProfile.fullName || "",
        username: fetchedProfile.username || "",
        bio: fetchedProfile.bio || "",
        github: fetchedProfile.github || "",
        linkedin: fetchedProfile.linkedin || "",
        portfolio: fetchedProfile.portfolio || "",
      });
    }
  }, [fetchedProfile]);

  // Follow/Unfollow mutations
  const followMutation = useMutation({
    mutationFn: followUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("User followed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: unfollowUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("User unfollowed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Calculate mutual followers
  const mutualFollowers = followersData.filter(follower => 
    followingData.some(following => following._id === follower._id)
  );

  // Calculate user stats from their drafts (or viewed user's public data)
  // When viewing another user's profile, we only use fetchedProfile data
  const userStats = isOwnerProfile
    ? {
        projects: myDrafts?.length || 0,
        completed: myDrafts?.filter(d => d.currentStage === "Launched but abandoned" || d.currentStage === "Almost complete").length || 0,
        revived: myDrafts?.filter(d => d.raisedHands && d.raisedHands.length > 0).length || 0,
        collabs: collaborationsData.length,
        followers: followersData.length,
        following: followingData.length,
      }
    : {
        projects: fetchedProfile?.publicProjects?.length || 0,
        completed: fetchedProfile?.publicProjects?.filter((d: any) => d.currentStage === "Launched but abandoned" || d.currentStage === "Almost complete").length || 0,
        revived: fetchedProfile?.publicProjects?.filter((d: any) => d.raisedHands && d.raisedHands.length > 0).length || 0,
        collabs: fetchedProfile?.collaborations?.length || 0,
        followers: fetchedProfile?.followers?.length || 0,
        following: fetchedProfile?.following?.length || 0,
      };

  // Build real activity from user's drafts and collaborations (only for owner)
  type ActivityItem = {
    icon: typeof FilePlus;
    label: string;
    target: string;
    time: string;
    tint: string;
  };

  const realActivity: ActivityItem[] = isOwnerProfile ? (() => {
    const activity: ActivityItem[] = [];

    // Drafts created by the user
    (myDrafts || []).slice(0, 3).forEach(draft => {
      activity.push({
        icon: FilePlus,
        label: "Created a new draft",
        target: draft.projectName,
        time: getTimeSince(draft.lastWorkedOn || (draft as any).createdAt),
        tint: "violet",
      });
    });

    // Collaborations joined
    collaborationsData.slice(0, 2).forEach(draft => {
      activity.push({
        icon: GitBranch,
        label: "Started collaboration on",
        target: draft.projectName,
        time: getTimeSince((draft as any).updatedAt || (draft as any).createdAt),
        tint: "emerald",
      });
    });

    // Revived drafts (drafts with raisedHands)
    (myDrafts || [])
      .filter(d => d.raisedHands && d.raisedHands.length > 0)
      .slice(0, 1)
      .forEach(draft => {
        activity.push({
          icon: RefreshCw,
          label: "Revived a project",
          target: draft.projectName,
          time: getTimeSince(draft.lastWorkedOn || (draft as any).createdAt),
          tint: "sky",
        });
      });

    return activity;
  })() : [];

  // Sort by recency (most recent first) and limit to 4
  const activityList = realActivity.slice(0, 4);

  // Get user's projects from their drafts or from fetchedProfile when viewing another user
  const userProjects = (isOwnerProfile ? myDrafts : (fetchedProfile?.publicProjects as any) || [])
    .slice(0, 3)
    .map(draft => ({
      name: draft.projectName,
      description: draft.oneLiner,
      status: (draft.currentStage === "Launched but abandoned" || draft.currentStage === "Almost complete" 
        ? "Completed" 
        : draft.currentStage === "Idea only" 
        ? "On Hold" 
        : "Building") as ProjectStatus,
      stack: draft.techStack.slice(0, 3),
      updated: `Updated ${getTimeSince(draft.lastWorkedOn ? new Date(draft.lastWorkedOn) : null)}`,
      icon: draft.projectName.slice(0, 2).toUpperCase(),
      tint: getTintForProject(draft.domain),
    }));

  const displayName = profileData.fullName || authUser?.email?.split("@")[0] || "User";
  const displayUsername = profileData.username || authUser?.email?.split("@")[0] || "user";
  const displayInitials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

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
      const updated = await updateUserProfile({
        fullName: profileData.fullName,
        username: profileData.username,
        bio: profileData.bio,
        github: profileData.github,
        linkedin: profileData.linkedin,
        portfolio: profileData.portfolio,
      });
      // Update the local state and cache immediately
      setProfileData({
        fullName: updated.fullName || "",
        username: updated.username || "",
        bio: updated.bio || "",
        github: updated.github || "",
        linkedin: updated.linkedin || "",
        portfolio: updated.portfolio || "",
      });
      queryClient.setQueryData(["user-profile"], updated);
      toast.success("Profile updated successfully!");
      setProfileModal(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Update STATS with real data
  const STATS = [
    { key: "projects", label: "Projects", value: userStats.projects, icon: FolderKanban, tint: "amber" },
    { key: "completed", label: "Completed", value: userStats.completed, icon: CheckCircle2, tint: "emerald" },
    { key: "revived", label: "Revived", value: userStats.revived, icon: RefreshCw, tint: "violet" },
    { key: "collabs", label: "Collaborations", value: userStats.collabs, icon: Users, tint: "sky" },
    { key: "followers", label: "Followers", value: userStats.followers, icon: UserPlus, tint: "rose" },
    { key: "following", label: "Following", value: userStats.following, icon: UserCheck, tint: "indigo" },
  ] as const;

  const list = NETWORK[tab];
  const filtered = list.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.handle.toLowerCase().includes(query.toLowerCase()),
  );

  // Convert real data to display format
  const displayFollowers: typeof NETWORK.followers = followersData.map(u => ({
    name: u.fullName || u.email,
    handle: `@${u.username || u.email.split('@')[0]}`,
    role: u.bio || "DraftYard User",
    initials: (u.fullName || u.email).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    state: followingData.some(f => f._id === u._id) ? "Following" : "Follow",
    _id: u._id,
  }));

  const displayFollowing: typeof NETWORK.following = followingData.map(u => ({
    name: u.fullName || u.email,
    handle: `@${u.username || u.email.split('@')[0]}`,
    role: u.bio || "DraftYard User",
    initials: (u.fullName || u.email).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    state: "Following" as const,
    _id: u._id,
  }));

  const displayMutual: typeof NETWORK.mutual = mutualFollowers.map(u => ({
    name: u.fullName || u.email,
    handle: `@${u.username || u.email.split('@')[0]}`,
    role: u.bio || "DraftYard User",
    initials: (u.fullName || u.email).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    state: "Following" as const,
    _id: u._id,
  }));

  const NETWORK_REAL = {
    following: displayFollowing,
    followers: displayFollowers,
    mutual: displayMutual,
  };

  const listReal = NETWORK_REAL[tab];
  const filteredReal = listReal.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.handle.toLowerCase().includes(query.toLowerCase()),
  );

  const handleFollowToggle = (userId: string, currentState: string) => {
    if (currentState === "Following") {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

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
                        <AvatarImage src="" alt={displayName} />
                        <AvatarFallback className="bg-transparent text-2xl font-semibold text-primary">
                          {displayInitials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card bg-emerald-500" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="font-display text-2xl font-semibold tracking-tight">{displayName}</h2>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">@{displayUsername}</span>
                          <Badge className="border-primary/25 bg-primary/12 text-primary hover:bg-primary/15">
                            Pro Member
                          </Badge>
                        </div>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                          {profileData.bio || "No bio added yet. Click Edit Profile to add one."}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" /> {USER.location}
                          </span>
                          {profileData.github && (
                            <a href={`https://${profileData.github}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
                              <Github className="h-4 w-4" /> {profileData.github}
                            </a>
                          )}
                          {profileData.linkedin && (
                            <a href={`https://${profileData.linkedin}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
                              <Linkedin className="h-4 w-4" /> {profileData.linkedin}
                            </a>
                          )}
                          {profileData.portfolio && (
                            <a href={`https://${profileData.portfolio}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
                              <Globe className="h-4 w-4" /> {profileData.portfolio}
                            </a>
                          )}
                        </div>
                      </div>

                        <div className="flex items-center gap-2">
                          {!publicUserId && (
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleEditClick}>
                              <Pencil className="h-3.5 w-3.5" /> Edit Profile
                            </Button>
                          )}
                        <Button 
                          size="sm" 
                          className="gap-1.5"
                          onClick={() => {
                            const profileUrl = `${window.location.origin}/profile?user=${displayUsername}`;
                            navigator.clipboard.writeText(profileUrl).then(() => {
                              toast.success("Profile link copied to clipboard!");
                            }).catch(() => {
                              toast.error("Failed to copy link");
                            });
                          }}
                        >
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
                    {isOwnerProfile && (
                      <Link to="/workspace" search={{ draftId: undefined }} className="text-xs font-medium text-primary hover:underline">
                        View all
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    {profileLoading ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">Loading projects...</div>
                    ) : userProjects.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-muted-foreground">No projects yet</p>
                        {isOwnerProfile && (
                          <Link to="/new-draft">
                            <Button size="sm" className="mt-3">Create Your First Draft</Button>
                          </Link>
                        )}
                      </div>
                    ) : (
                      userProjects.map((p) => (
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
                      ))
                    )}
                  </div>
                  {isOwnerProfile && (
                    <div className="mt-3">
                      <Link to="/workspace" search={{ draftId: undefined }} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        View all projects <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </section>

                {/* Skills + Network stacked */}
                <div className="flex flex-col gap-6">
                  <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-base font-semibold">Skills</h3>
                      {isOwnerProfile && !showSkillInput && (
                        <button
                          onClick={() => setShowSkillInput(true)}
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Skill
                        </button>
                      )}
                    </div>

                    {/* Saved skills */}
                    <div className="flex flex-wrap gap-2">
                      {(fetchedProfile?.skills ?? []).map((s) => (
                        <span
                          key={s}
                          className={`group flex items-center gap-1 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground/85 transition-colors ${isOwnerProfile ? "hover:border-primary/40 hover:text-primary" : ""}`}
                        >
                          {s}
                          {isOwnerProfile && (
                            <button
                              onClick={() => removeSkillMutation.mutate(s)}
                              disabled={removeSkillMutation.isPending}
                              className="ml-0.5 hidden rounded group-hover:inline-flex text-muted-foreground hover:text-destructive"
                              title="Remove"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                      ))}

                      {/* Pending chips (not yet saved) - only in owner mode */}
                      {isOwnerProfile && pendingSkills.map((s) => (
                        <span
                          key={s}
                          className="flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                        >
                          {s}
                          <button onClick={() => removePendingSkill(s)} className="ml-0.5 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Empty state */}
                    {(fetchedProfile?.skills?.length ?? 0) === 0 && pendingSkills.length === 0 && !showSkillInput && (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <p className="text-sm text-muted-foreground">{isOwnerProfile ? "No skills added yet." : "No skills added"}</p>
                        {isOwnerProfile && (
                          <button
                            onClick={() => setShowSkillInput(true)}
                            className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add your first skill
                          </button>
                        )}
                      </div>
                    )}

                    {/* Input area - only in owner mode */}
                    {isOwnerProfile && showSkillInput && (
                      <div className="mt-3 rounded-xl border border-border/60 bg-background/50 p-3">
                        <p className="mb-2 text-[11px] text-muted-foreground">
                          Type a skill and press <kbd className="rounded border border-border px-1 text-[10px]">Enter</kbd> or <kbd className="rounded border border-border px-1 text-[10px]">,</kbd> to add it as a chip, then save all at once.
                        </p>
                        <input
                          autoFocus
                          type="text"
                          placeholder="e.g. Python, React, Docker..."
                          value={skillInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Auto-add chip when user types a comma
                            if (val.endsWith(",")) {
                              setSkillInput(val);
                              commitInputToChip();
                            } else {
                              setSkillInput(val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); commitInputToChip(); }
                            if (e.key === "Escape") { setShowSkillInput(false); setSkillInput(""); setPendingSkills([]); }
                            // Backspace on empty input removes last pending chip
                            if (e.key === "Backspace" && skillInput === "" && pendingSkills.length > 0) {
                              setPendingSkills(prev => prev.slice(0, -1));
                            }
                          }}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                        />
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-7 px-4 text-xs"
                            onClick={handleSaveSkills}
                            disabled={addSkillMutation.isPending || (pendingSkills.length === 0 && !skillInput.trim())}
                          >
                            {addSkillMutation.isPending ? "Saving..." : `Save${pendingSkills.length > 0 ? ` (${pendingSkills.length})` : ""}`}
                          </Button>
                          <button
                            onClick={() => { setShowSkillInput(false); setSkillInput(""); setPendingSkills([]); }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </section>

                  {isOwnerProfile && (
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

                    {/* Tabs */}
                    <div className="mb-4 flex items-center gap-1 rounded-lg border border-border bg-background/40 p-1 text-xs">
                      {(["following", "followers", "mutual"] as const).map((t) => {
                        const count = t === "following" ? followingData.length : t === "followers" ? followersData.length : mutualFollowers.length;
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

                    {/* Following / Followers / Mutual list */}
                    {(() => {
                      const listSource = tab === "following" ? followingData : tab === "followers" ? followersData : mutualFollowers;
                      const listReal = listSource.map((u: any) => ({
                        _id: u._id || u.id || u.email || String(Math.random()),
                        name: u.fullName || u.name || u.username || "User",
                        handle: u.username ? `@${u.username}` : (u.email || u.handle || ""),
                        initials: getInitials(u.fullName || u.name || u.username, u.email),
                        state: tab === "following" ? ("Following" as const) : ("Follow" as const),
                      }));

                      return (
                        <ul className="flex flex-col gap-2">
                          {listReal.slice(0, 3).map((u) => (
                        <li key={u._id} className="flex items-center gap-3 rounded-lg bg-background/50 px-2 py-2">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/12 text-[11px] font-semibold text-primary">
                              {u.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{u.name}</div>
                            <div className="truncate text-[11px] text-muted-foreground">{u.handle}</div>
                          </div>
                          <Button
                            variant={u.state === "Following" ? "outline" : "default"}
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => handleFollowToggle(u._id, u.state)}
                            disabled={followMutation.isPending || unfollowMutation.isPending}
                          >
                            {u.state}
                          </Button>
                        </li>
                      ))}

                      {listReal.length === 0 && (
                        <li className="py-3 text-center text-xs text-muted-foreground">
                          No {tab} yet
                        </li>
                      )}
                    </ul>
                  );
                })()}

                    {/* ── Always-visible suggestions ── */}
                    {suggestionsData.length > 0 && (
                      <div className="mt-4 border-t border-border/60 pt-4">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          People you may know
                        </p>
                        <ul className="flex flex-col gap-2">
                          {suggestionsData.slice(0, 4).map((u) => {
                            const name = u.fullName || u.email;
                            const handle = `@${u.username || u.email.split("@")[0]}`;
                            const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                            const isFollowing = followingData.some(f => f._id === u._id);
                            return (
                              <li key={u._id} className="flex items-center gap-3 rounded-lg border border-dashed border-primary/20 bg-primary/[0.03] px-2 py-2">
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback className="bg-violet-500/12 text-[11px] font-semibold text-violet-500">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium">{name}</div>
                                  <div className="truncate text-[11px] text-muted-foreground">{handle}</div>
                                </div>
                                <Button
                                  size="sm"
                                  variant={isFollowing ? "outline" : "default"}
                                  className="h-7 px-3 text-xs"
                                  onClick={() => {
                                    if (isFollowing) {
                                      unfollowMutation.mutate(u._id, {
                                        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-suggestions"] }),
                                      });
                                    } else {
                                      followMutation.mutate(u._id, {
                                        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-suggestions"] }),
                                      });
                                    }
                                  }}
                                  disabled={followMutation.isPending || unfollowMutation.isPending}
                                >
                                  {isFollowing ? "Following" : "+ Follow"}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </section>
                  )}
                </div>
              </div>

              {/* -------- RECENT ACTIVITY (owner only) -------- */}
              {isOwnerProfile && (
              <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="mb-5 font-display text-base font-semibold">Recent Activity</h3>
                {activityList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Create a draft or join a collaboration to see your activity here.</p>
                  </div>
                ) : (
                  <ol className="relative grid gap-6 md:grid-cols-4">
                    <div className="absolute left-4 right-4 top-4 hidden h-px bg-border md:block" />
                    {activityList.map((a, i) => (
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
                )}
              </section>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* -------- FOLLOWERS / FOLLOWING MODAL (owner only) -------- */}
      {isOwnerProfile && (
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

          {(() => {
            const modalListSource = modal === "following" ? followingData : modal === "followers" ? followersData : mutualFollowers;
            const filteredReal = modalListSource
              .map((u: any) => ({
                _id: u._id || u.id || u.email || String(Math.random()),
                name: u.fullName || u.name || u.username || "User",
                handle: u.username ? `@${u.username}` : (u.email || u.handle || ""),
                initials: getInitials(u.fullName || u.name || u.username, u.email),
                state: modal === "following" ? ("Following" as const) : ("Follow" as const),
              }))
              .filter((u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.handle.toLowerCase().includes(query.toLowerCase()));

            return (
              <ul className="max-h-80 overflow-y-auto p-2">
                {filteredReal.length === 0 && (
                  <li className="p-6 text-center text-sm text-muted-foreground">No results.</li>
                )}
                {filteredReal.map((u) => (
                  <li key={u._id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-background/60">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/12 text-[11px] font-semibold text-primary">
                        {u.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{u.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {u.handle}
                      </div>
                    </div>
                    <Button
                      variant={u.state === "Following" ? "outline" : "default"}
                      size="sm"
                      className="h-7 px-3 text-xs"
                      onClick={() => handleFollowToggle(u._id, u.state)}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                    >
                      {u.state}
                    </Button>
                  </li>
                ))}
              </ul>
            );
          })()}

          <button
            onClick={() => setModal(null)}
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogContent>
      </Dialog>
      )}

      {/* -------- PROFILE EDIT MODAL (owner only) -------- */}
      {isOwnerProfile && (
      <Dialog open={profileModal} onOpenChange={setProfileModal}>
        <DialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-xl sm:rounded-2xl">
          <DialogHeader>
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
      )}
    </SidebarProvider>
  );
}
