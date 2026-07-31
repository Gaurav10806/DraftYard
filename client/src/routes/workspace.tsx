// import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
// import { motion, AnimatePresence } from "framer-motion";
// import { useState, useEffect, type ReactNode } from "react";
// import { toast } from "sonner";
// import { ChevronRight, Plus, Calendar, Zap } from "lucide-react";
// import {
//   ArrowRight,
//   ArrowUpRight,
//   Bot,
//   CheckCircle2,
//   Circle,
//   Clock,
//   Crown,
//   Edit3,
//   Flag,
//   Github,
//   GitPullRequest,
//   Globe2,
//   LayoutList,
//   Lightbulb,
//   LineChart,
//   Link2,
//   Lock,
//   MoreHorizontal,
//   Paperclip,
//   Rocket,
//   Send,
//   Share2,
//   Shield,
//   Sparkles,
//   UploadCloud,
//   UserPlus,
//   Users,
//   X,
// } from "lucide-react";
// import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
// import { AppSidebar } from "@/components/dashboard/app-sidebar";
// import { TopBar } from "@/components/dashboard/top-bar";
// import { ThemeToggle } from "@/components/theme-toggle";
// import { ProtectedRoute } from "@/components/auth/protected-route";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { Progress } from "@/components/ui/progress";
// import { Separator } from "@/components/ui/separator";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Sheet, SheetContent } from "@/components/ui/sheet";
// import { useMyDrafts } from "@/hooks/use-drafts";
// import { stageToProgress } from "@/lib/drafts-insights";
// import {
//   fetchWorkspace,
//   type WorkspaceData,
//   fetchFeed,
//   type Draft,
//   navigateToWorkspace,
//   fetchAiIdeaAnalysis,
//   type AiIdeaAnalysis,
//   fetchTasks,
//   createTask,
//   updateTask,
//   deleteTask,
//   addTaskComment,
//   updateTaskChecklist,
//   type TaskData,
//   type TaskChecklistItem,
//   type TaskComment,
//   fetchTeamData,
//   inviteTeamMember,
//   updateTeamMemberRole,
//   removeTeamMember,
//   approveJoinRequest,
//   declineJoinRequest,
//   updateDraftStage,
//   type TeamMemberData,
//   type JoinRequestData,
//   type ActivityLogData,
//   type TeamResponseData,
//   sendAiChatMessage,
//   leaveWorkspace,
// } from "@/lib/api";
// import { useAuth } from "@/lib/auth-context";
// import { LogOut, Settings, UserCircle } from "lucide-react";
// import { getInitials } from "@/lib/utils";
// import { useQueryClient } from "@tanstack/react-query";

// export const Route = createFileRoute("/workspace")({
//   validateSearch: (search: Record<string, unknown>) => ({
//     draftId: typeof search.draftId === "string" ? search.draftId : undefined,
//   }),
//   head: () => ({
//     meta: [
//       { title: "Workspace · DraftYard" },
//       {
//         name: "description",
//         content: "Your workspace hub — manage all your drafts in one place.",
//       },
//       { property: "og:title", content: "DraftYard Workspace" },
//     ],
//   }),
//   loader: async ({ location }) => {
//     const params = location.search as { draftId?: string };
//     const draftId = params.draftId;

//     if (!draftId) {
//       return { workspace: null, draft: null };
//     }

//     let workspace: WorkspaceData | null = null;
//     let draft: Draft | null = null;

//     try {
//       workspace = await fetchWorkspace(draftId);
//       const feedResponse = await fetchFeed();
//       draft = feedResponse.data.find((d) => d._id === draftId) ?? null;
//     } catch {
//       workspace = null;
//       draft = null;
//     }

//     return { workspace, draft, draftId };
//   },
//   component: WorkspacePage,
// });

// // ─────────────────────────────────────────────────────────────────────────────
// // Static demo data (mirrors the reference)
// // ─────────────────────────────────────────────────────────────────────────────

// const STAGES = ["Idea", "Prototype", "Building", "Testing", "Shipped"] as const;
// type Stage = (typeof STAGES)[number];

// // Static contributors mock data removed; team database queries used instead.

// type TaskStatus = "Todo" | "In Progress" | "Done";
// type Priority = "High" | "Medium" | "Low";

// // Static tasks mock data has been removed; database integration is used instead.

// // Static activity mock data removed; activity logs are retrieved dynamically.

// function WorkspacePage() {
//   const { draftId } = Route.useSearch();
//   const loaderData = Route.useLoaderData() as any;
//   const { workspace, draft } = loaderData;

//   if (draftId && workspace) {
//     return <WorkspaceDetailPage workspace={workspace} draft={draft} />;
//   }

//   return <WorkspaceHomePage />;
// }

// function WorkspaceHomePage() {
//   const { data: myDrafts = [], isLoading } = useMyDrafts();
//   const navigate = useNavigate();
//   const queryClient = useQueryClient();
//   const [roleFilter, setRoleFilter] = useState<"all" | "owned" | "shared">("all");

//   const ownedDrafts = myDrafts.filter((d: any) => d.isOwner || (!d._sharedRole && d.userRole !== "Contributor" && d.userRole !== "Viewer"));
//   const sharedDrafts = myDrafts.filter((d: any) => !d.isOwner && (d._sharedRole || d.userRole === "Contributor" || d.userRole === "Viewer"));

//   const filteredDrafts = roleFilter === "owned"
//     ? ownedDrafts
//     : roleFilter === "shared"
//     ? sharedDrafts
//     : myDrafts;

//   const handleLeaveWorkspace = async (d: any) => {
//     if (!d._id) return;
//     try {
//       await leaveWorkspace(d._id);
//       toast.success(`You have left "${d.projectName}".`);
//       await queryClient.invalidateQueries({ queryKey: ["my-drafts"] });
//     } catch (err: any) {
//       toast.error(err.message ?? "Failed to leave workspace");
//     }
//   };

//   const rolePillClass = (role: string) => {
//     if (role === "Owner")
//       return "bg-primary/15 text-primary border-primary/30";
//     if (role === "Contributor")
//       return "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30";
//     return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
//   };

//   return (
//     <ProtectedRoute>
//       <SidebarProvider>
//         <div className="flex min-h-screen w-full bg-background text-foreground">
//           <AppSidebar />
//           <SidebarInset className="flex min-w-0 flex-1 flex-col">
//             <TopBar showGreeting={false} />

//             <main className="flex-1 space-y-8 p-4 sm:p-6">
//               <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
//                 <span className="text-foreground font-medium">Workspace</span>
//               </nav>

//               <div className="flex flex-wrap items-center justify-between gap-4">
//                 <div>
//                   <h1 className="font-display text-2xl font-semibold tracking-tight">Workspace Hub</h1>
//                   <p className="mt-0.5 text-sm text-muted-foreground">
//                     {myDrafts.length === 0
//                       ? "Create or join a workspace to start collaborating"
//                       : `${myDrafts.length} workspace${myDrafts.length !== 1 ? "s" : ""} available (${ownedDrafts.length} owned, ${sharedDrafts.length} shared)`}
//                   </p>
//                 </div>
//                 <Button asChild className="rounded-xl gap-2">
//                   <Link to="/new-draft">
//                     <Plus className="h-4 w-4" /> New Draft
//                   </Link>
//                 </Button>
//               </div>

//               {/* Filter Tabs */}
//               <div className="flex items-center gap-2 border-b border-border/60 pb-3">
//                 <button
//                   onClick={() => setRoleFilter("all")}
//                   className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
//                     roleFilter === "all"
//                       ? "bg-primary text-primary-foreground"
//                       : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
//                   }`}
//                 >
//                   All Workspaces ({myDrafts.length})
//                 </button>
//                 <button
//                   onClick={() => setRoleFilter("owned")}
//                   className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
//                     roleFilter === "owned"
//                       ? "bg-primary text-primary-foreground"
//                       : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
//                   }`}
//                 >
//                   Owned ({ownedDrafts.length})
//                 </button>
//                 <button
//                   onClick={() => setRoleFilter("shared")}
//                   className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
//                     roleFilter === "shared"
//                       ? "bg-primary text-primary-foreground"
//                       : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
//                   }`}
//                 >
//                   Shared with Me ({sharedDrafts.length})
//                 </button>
//               </div>

//               {/* Workspaces List */}
//               <section className="space-y-4">
//                 {isLoading ? (
//                   <div className="space-y-3">
//                     {[...Array(3)].map((_, i) => (
//                       <div key={i} className="h-24 rounded-2xl bg-card/30 animate-pulse" />
//                     ))}
//                   </div>
//                 ) : filteredDrafts.length === 0 ? (
//                   roleFilter === "shared" ? (
//                     <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
//                       <Users className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
//                       <h3 className="font-display text-base font-semibold">No Shared Workspaces Yet</h3>
//                       <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
//                         When other project owners invite you as a Contributor or Viewer and you accept, their workspaces will appear here.
//                       </p>
//                     </div>
//                   ) : (
//                     <EmptyState />
//                   )
//                 ) : (
//                   <div className="space-y-3">
//                     {filteredDrafts.map((d: any, i: number) => {
//                       const isShared = !d.isOwner && (d._sharedRole || d.userRole === "Contributor" || d.userRole === "Viewer");
//                       return (
//                         <motion.div
//                           key={d._id}
//                           initial={{ opacity: 0, y: 10 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           transition={{ delay: i * 0.04 }}
//                         >
//                           {isShared ? (
//                             <SharedDraftCard
//                               draft={d}
//                               onClick={() => navigateToWorkspace(d._id!, d.projectName, navigate, (msg) => toast.error(msg))}
//                               onLeave={() => handleLeaveWorkspace(d)}
//                               rolePillClass={rolePillClass}
//                             />
//                           ) : (
//                             <DraftCard
//                               draft={d}
//                               onClick={() => navigateToWorkspace(d._id!, d.projectName, navigate, (msg) => toast.error(msg))}
//                               rolePillClass={rolePillClass}
//                             />
//                           )}
//                         </motion.div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </section>
//             </main>
//           </SidebarInset>
//         </div>
//       </SidebarProvider>
//     </ProtectedRoute>
//   );
// }


// function WorkspaceDetailPage({ workspace, draft }: { workspace: WorkspaceData; draft: Draft | null }) {
//   const { user } = useAuth();
//   const [tab, setTab] = useState<"overview" | "tasks" | "team">("overview");
//   const [available, setAvailable] = useState(true);
//   const [stage, setStage] = useState<Stage>((draft?.currentStage as Stage) || "Building");
//   const [pendingStage, setPendingStage] = useState<Stage | null>(null);
//   const [aiOpen, setAiOpen] = useState(false);
//   const [tasks, setTasks] = useState<TaskData[]>([]);
//   const [loadingTasks, setLoadingTasks] = useState(true);
//   const [teamData, setTeamData] = useState<TeamResponseData | null>(null);
//   const [loadingTeam, setLoadingTeam] = useState(true);


//   const isCurrentUserOwner =
//   teamData?.members?.some(
//     (m: TeamMemberData) => m.userId === user?._id && m.role === "Owner"
//   ) || false;

// const myMemberRole =
//   teamData?.members?.find(
//     (m: TeamMemberData) => m.userId === user?._id
//   )?.role || "Viewer";

// // Owner's name from team data
// const ownerMember = teamData?.members?.find((m: TeamMemberData) => m.role === "Owner");
// const ownerName = ownerMember?.name || draft?.submittedBy?.name || "";

// const isViewer =
//   !isCurrentUserOwner && myMemberRole === "Viewer";

// const visibleTabs: Array<"overview" | "tasks" | "team"> =
//   isViewer
//     ? ["overview"]
//     : ["overview", "tasks", "team"];

//   useEffect(() => {
//     if (draft?.currentStage) {
//       setStage(draft.currentStage as Stage);
//     }
//   }, [draft?.currentStage]);

//   useEffect(() => {
//   if (isViewer && (tab === "tasks" || tab === "team")) {
//     setTab("overview");
//   }
// }, [isViewer, tab]);

//   const refreshTeam = () => {
//     if (!draft?._id) return;
//     setLoadingTeam(true);
//     fetchTeamData(draft._id)
//       .then(setTeamData)
//       .catch((err: any) => console.error("Error loading team:", err))
//       .finally(() => setLoadingTeam(false));
//   };

//   useEffect(() => {
//     refreshTeam();
//   }, [draft?._id]);

//   const refreshTasks = () => {
//     if (!draft?._id) return;
//     setLoadingTasks(true);
//     fetchTasks(draft._id)
//       .then(setTasks)
//       .catch((err: any) => console.error("Error loading tasks:", err))
//       .finally(() => setLoadingTasks(false));
//   };

//   useEffect(() => {
//     refreshTasks();
//   }, [draft?._id]);

//   const projectName = draft?.projectName || "Project";

//   const aiContext = {
//   draft,
//   tasks,
//   teamData,
//   activityLog: teamData?.activity ?? [],
// };
//   return (
//     <ProtectedRoute>
//       <SidebarProvider>
//         <div className="flex min-h-screen w-full bg-background text-foreground">
//           <AppSidebar />
//           <SidebarInset className="flex min-w-0 flex-1 flex-col">
//             <WorkspaceTopBar projectName={projectName} />

//             <motion.main
//               className="flex-1 space-y-6 p-4 sm:p-6"
//               initial={{ opacity: 0, y: 8 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
//             >
//               <ProjectHeader
//                 stage={stage}
//                 onStageClick={(s) => setPendingStage(s)}
//                 available={available}
//                 onAvailableChange={setAvailable}
//                 projectName={projectName}
//                 description={draft?.oneLiner || ""}
//                 members={teamData?.members || []}
//                 ownerName={ownerName}
//                 userRole={myMemberRole}
//                 onInviteClick={
//                   teamData?.members?.some((m: TeamMemberData) => m.userId === user?._id && m.role === "Owner")
//                     ? () => setTab("team")
//                     : undefined
//                 }
//               />

//              <TabBar
//   tab={tab}
//   onChange={setTab}
//   visibleTabs={visibleTabs}
// />

//               <AnimatePresence mode="wait">
//                 <motion.div
//                   key={tab}
//                   initial={{ opacity: 0, y: 6 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -4 }}
//                   transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
//                 >
//                   {tab === "overview" && (
//                     <OverviewTab
//                       draft={draft}
//                       workspace={workspace}
//                       tasks={tasks}
//                       teamData={teamData}
//                       onViewFullSuggestion={() => setAiOpen(true)}
//                     />
//                   )}
//                   {tab === "tasks" && !isViewer && (
//   <TasksTab
//     draftId={draft?._id}
//     tasks={tasks}
//     refreshTasks={refreshTasks}
//     loading={loadingTasks}
//   />
// )}
//                   {tab === "team" && !isViewer && (
//   <TeamTab
//     draftId={draft?._id}
//     teamData={teamData}
//     refreshTeam={refreshTeam}
//     loading={loadingTeam}
//   />
// )}
//                 </motion.div>
//               </AnimatePresence>
//             </motion.main>
//           </SidebarInset>
//         </div>

//         {/* Stage change dialog */}
//         <Dialog open={!!pendingStage} onOpenChange={(o) => !o && setPendingStage(null)}>
//           <DialogContent className="sm:max-w-md">
//             <DialogHeader>
//               <DialogTitle>Update stage</DialogTitle>
//               <DialogDescription>
//                 Move <span className="font-medium text-foreground">{projectName}</span> to{" "}
//                 <span className="font-medium text-foreground">{pendingStage}</span>. Contributors
//                 will be notified.
//               </DialogDescription>
//             </DialogHeader>
//             <Textarea placeholder="Add an optional note about this stage change…" rows={3} />
//             <DialogFooter>
//               <Button variant="ghost" onClick={() => setPendingStage(null)}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={() => {
//                   if (pendingStage && draft?._id) {
//                     updateDraftStage(draft._id, pendingStage)
//                       .then(() => {
//                         setStage(pendingStage);
//                         toast.success("Stage updated successfully!");
//                         refreshTeam();
//                       })
//                       .catch((err: any) => {
//                         toast.error(err.message ?? "Failed to update stage");
//                       })
//                       .finally(() => {
//                         setPendingStage(null);
//                       });
//                   }
//                 }}
//               >
//                 Update stage
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Floating AI */}
//        <FloatingAI
//   open={aiOpen}
//   onOpenChange={setAiOpen}
//   projectName={projectName}
//   aiContext={aiContext}
// />
//       </SidebarProvider>
//     </ProtectedRoute>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Top Bar with project name
// // ─────────────────────────────────────────────────────────────────────────────

// function WorkspaceTopBar({ projectName }: { projectName: string }) {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const initials = getInitials(user?.name, user?.email);

//   return (
//     <header className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3 sm:px-6">
//       <div className="flex items-center gap-3">
//         <SidebarTrigger />
//         <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
//           <Link to="/workspace" search={{ draftId: undefined }} className="hover:text-foreground transition-colors">
//             Workspace
//           </Link>
//           <span className="text-muted-foreground/50">/</span>
//           <span className="font-medium text-foreground">{projectName}</span>
//         </nav>
//       </div>
//       <div className="flex items-center gap-2">
//         <ThemeToggle />
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <button>
//               <Avatar className="h-9 w-9 ring-2 ring-border transition-shadow hover:ring-primary/50">
//                 <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
//                   {initials}
//                 </AvatarFallback>
//               </Avatar>
//             </button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end" className="w-52">
//             <DropdownMenuLabel className="truncate">{user?.name || user?.email || "Account"}</DropdownMenuLabel>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
//               <UserCircle className="mr-2 h-4 w-4" /> Profile
//             </DropdownMenuItem>
//             <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
//               <Settings className="mr-2 h-4 w-4" /> Settings
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem
//               onClick={() => {
//                 logout();
//                 toast("Signed out");
//                 navigate({ to: "/login" });
//               }}
//             >
//               <LogOut className="mr-2 h-4 w-4" /> Log out
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>
//     </header>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Project Header
// // ─────────────────────────────────────────────────────────────────────────────

// function ProjectHeader({
//   stage,
//   onStageClick,
//   available,
//   onAvailableChange,
//   projectName,
//   description,
//   members,
//   onInviteClick,
//   ownerName,
//   userRole,
// }: {
//   stage: Stage;
//   onStageClick: (s: Stage) => void;
//   available: boolean;
//   onAvailableChange: (v: boolean) => void;
//   projectName: string;
//   description: string;
//   members: TeamMemberData[];
//   onInviteClick?: () => void;
//   ownerName?: string;
//   userRole?: string;
// }) {
//   const initials = projectName.slice(0, 2).toUpperCase();

//   return (
//     <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
//       {/* row 1: identity + actions */}
//       <div className="flex flex-wrap items-start justify-between gap-6">
//         <div className="flex min-w-0 items-start gap-4">
//           <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/15 font-display text-base font-bold text-primary">
//             {initials}
//           </div>
//           <div className="min-w-0">
//             <div className="flex flex-wrap items-center gap-2">
//               <h1 className="font-display text-[24px] font-semibold leading-tight tracking-tight">
//                 {projectName}
//               </h1>
//               <button className="text-muted-foreground transition-colors duration-[180ms] hover:text-foreground">
//                 <Edit3 className="h-3.5 w-3.5" />
//               </button>
//               <Badge variant="secondary" className="rounded-full text-[10px]">
//                 <span className="mr-1 h-1.5 w-1.5 rounded-full bg-primary" />
//                 {stage}
//               </Badge>
//               <Badge variant="outline" className="gap-1 rounded-full text-[10px]">
//                 <Globe2 className="h-3 w-3" /> Public
//               </Badge>
//               <Badge variant="outline" className="gap-1 rounded-full text-[10px]">
//                 <Github className="h-3 w-3" /> Connected
//               </Badge>
//               {/* Role badge — only shown for non-owners and when role is available */}
//               {userRole && userRole !== "Owner" && (
//                 <Badge
//                   variant="outline"
//                   className={`gap-1 rounded-full text-[10px] ${
//                     userRole === "Contributor"
//                       ? "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400"
//                       : "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400"
//                   }`}
//                 >
//                   {userRole === "Contributor" ? (
//                     <Edit3 className="h-3 w-3" />
//                   ) : (
//                     <Lock className="h-3 w-3" />
//                   )}
//                   {userRole}
//                 </Badge>
//               )}
//               {userRole && userRole !== "Owner" && ownerName && (
//                 <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
//                   <Users className="h-3 w-3" />
//                   <span>by <span className="font-medium text-foreground">{ownerName}</span></span>
//                 </span>
//               )}
//             </div>
//             <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
//               {description || "AI-powered project for building."}
//             </p>
//           </div>
//         </div>

//         <div className="flex flex-wrap items-center gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             className="rounded-full"
//             onClick={() => {
//               const url = `${window.location.origin}/workspace${window.location.search}`;
//               navigator.clipboard.writeText(url).then(() => {
//                 toast.success("Project link copied to clipboard!");
//               }).catch(() => toast.error("Failed to copy link"));
//             }}
//           >
//             <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
//           </Button>
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
//                 <MoreHorizontal className="h-4 w-4" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-48">
//               <DropdownMenuItem
//                 onClick={() => {
//                   const url = `${window.location.origin}/workspace${window.location.search}`;
//                   navigator.clipboard.writeText(url).then(() => {
//                     toast.success("Project link copied!");
//                   }).catch(() => toast.error("Failed to copy link"));
//                 }}
//               >
//                 <Link2 className="mr-2 h-4 w-4" /> Copy project link
//               </DropdownMenuItem>
//               <DropdownMenuItem
//                 onClick={() => {
//                   const data = {
//                     projectName,
//                     description,
//                     stage,
//                     exportedAt: new Date().toISOString(),
//                     url: window.location.href,
//                   };
//                   const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
//                   const link = document.createElement("a");
//                   link.href = URL.createObjectURL(blob);
//                   link.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-workspace.json`;
//                   document.body.appendChild(link);
//                   link.click();
//                   document.body.removeChild(link);
//                   URL.revokeObjectURL(link.href);
//                   toast.success("Project exported!");
//                 }}
//               >
//                 <UploadCloud className="mr-2 h-4 w-4" /> Export
//               </DropdownMenuItem>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem
//                 className="text-destructive focus:text-destructive"
//                 onClick={() => {
//                   toast("Project archived (feature coming soon)");
//                 }}
//               >
//                 Archive project
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>

//       <Separator className="my-6" />

//       {/* row 2: revival score + stage tracker + contributors */}
//       <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
//         <RevivalScore />
//         <StageTracker current={stage} onSelect={onStageClick} />
//         <div className="flex flex-col items-start gap-2 lg:items-end">
//           <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
//             Contributors
//           </span>
//           <div className="flex items-center gap-3">
//             <div className="flex -space-x-2">
//               {members.slice(0, 4).map((c: TeamMemberData) => {
//                 const initials = c.name
//                   ? c.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
//                   : "UN";
//                 return (
//                   <Avatar key={c.userId} className="h-7 w-7 ring-2 ring-card">
//                     <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
//                       {initials}
//                     </AvatarFallback>
//                   </Avatar>
//                 );
//               })}
//               {members.length > 4 && (
//                 <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-card">
//                   +{members.length - 4}
//                 </span>
//               )}
//             </div>
//             {onInviteClick && (
//               <Button onClick={onInviteClick} size="sm" variant="ghost" className="h-8 rounded-full text-xs">
//                 <UserPlus className="mr-1 h-3.5 w-3.5" /> Invite
//               </Button>
//             )}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// function RevivalScore() {
//   return (
//     <div className="rounded-xl border border-border bg-background p-4">
//       <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
//         <span>Revival Score</span>
//         <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--revive)]/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-normal text-[color:var(--revive)]">
//           <ArrowUpRight className="h-3 w-3" /> +4
//         </span>
//       </div>
//       <div className="mt-2 flex items-end gap-2">
//         <span className="font-display text-4xl font-semibold leading-none tracking-tight">72</span>
//         <span className="pb-1 text-xs text-muted-foreground">/100</span>
//       </div>
//       <div className="mt-3 flex items-center justify-between text-xs">
//         <span className="text-muted-foreground">Status</span>
//         <span className="font-medium text-[color:var(--revive)]">Good</span>
//       </div>
//     </div>
//   );
// }

// function StageTracker({ current, onSelect }: { current: Stage; onSelect: (s: Stage) => void }) {
//   const currentIndex = STAGES.indexOf(current);
//   return (
//     <div>
//       <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
//         <span>Stage Tracker</span>
//         <span className="tracking-normal text-muted-foreground/80 normal-case">Click to update</span>
//       </div>
//       <div className="mt-3 flex items-center">
//         {STAGES.map((s, i) => {
//           const done = i < currentIndex;
//           const active = i === currentIndex;
//           return (
//             <div key={s} className="flex flex-1 items-center">
//               <button
//                 onClick={() => onSelect(s)}
//                 className="group flex flex-col items-center gap-1.5 focus:outline-none"
//               >
//                 <span
//                   className={`grid h-7 w-7 place-items-center rounded-full border transition-all duration-[220ms] ${
//                     active
//                       ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
//                       : done
//                         ? "border-primary/50 bg-primary/10 text-primary"
//                         : "border-border bg-background text-muted-foreground group-hover:border-primary/50 group-hover:text-foreground"
//                   }`}
//                 >
//                   {done ? (
//                     <CheckCircle2 className="h-4 w-4" />
//                   ) : (
//                     <span className="text-[10px] font-semibold">{i + 1}</span>
//                   )}
//                 </span>
//                 <span
//                   className={`text-[11px] font-medium transition-colors duration-[180ms] ${
//                     active ? "text-foreground" : "text-muted-foreground"
//                   }`}
//                 >
//                   {s}
//                 </span>
//               </button>
//               {i < STAGES.length - 1 && (
//                 <span
//                   className={`mx-2 h-px flex-1 transition-colors duration-[220ms] ${
//                     i < currentIndex ? "bg-primary/40" : "bg-border"
//                   }`}
//                 />
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tab Bar
// // ─────────────────────────────────────────────────────────────────────────────
// function TabBar({
//   tab,
//   onChange,
//   visibleTabs,
// }: {
//   tab: "overview" | "tasks" | "team";
//   onChange: (tab: "overview" | "tasks" | "team") => void;
//   visibleTabs: Array<"overview" | "tasks" | "team">;
// }) {
//  const items: { id: "overview" | "tasks" | "team"; label: string; icon: typeof LayoutList }[] = [
//   { id: "overview" as const, label: "Overview", icon: LineChart },

//   ...(visibleTabs.includes("tasks")
//     ? [{ id: "tasks" as const, label: "Tasks", icon: LayoutList }]
//     : []),

//   ...(visibleTabs.includes("team")
//     ? [{ id: "team" as const, label: "Team", icon: Users }]
//     : []),
// ];
//   return (
//     <div className="flex items-center gap-1 border-b border-border/60">
//       {items.map((it) => {
//         const active = tab === it.id;
//         return (
//           <button
//             key={it.id}
//             onClick={() => onChange(it.id)}
//             className={`group relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors duration-[180ms] ${
//               active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
//             }`}
//           >
//             <it.icon className="h-3.5 w-3.5" />
//             {it.label}
//             <span
//               className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary transition-all duration-[220ms] ${
//                 active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-50"
//               }`}
//             />
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Card primitive
// // ─────────────────────────────────────────────────────────────────────────────

// function Card({
//   title,
//   action,
//   className = "",
//   children,
// }: {
//   title?: string;
//   action?: ReactNode;
//   className?: string;
//   children: ReactNode;
// }) {
//   return (
//     <div
//       className={`rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-[220ms] hover:shadow-md ${className}`}
//     >
//       {(title || action) && (
//         <div className="flex items-center justify-between">
//           {title && (
//             <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
//               {title}
//             </h2>
//           )}
//           {action}
//         </div>
//       )}
//       <div className={title ? "mt-4" : ""}>{children}</div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // OVERVIEW TAB
// // ─────────────────────────────────────────────────────────────────────────────

// function generateFallbackAnalysis(draft: Draft): AiIdeaAnalysis {
//   const score = draft._id ? (parseInt(draft._id.slice(-4), 16) % 25) + 70 : 85;
//   const verdicts: Array<"Worth Building" | "Needs Refinement" | "Reconsider"> = ["Worth Building", "Needs Refinement"];
//   const verdict = verdicts[draft.projectName.length % verdicts.length];

//   return {
//     score,
//     verdict,
//     summary: `The project "${draft.projectName}" aims to address issues in the ${draft.domain} domain using ${draft.techStack?.slice(0, 3).join(", ") || "modern tech"}. It stalled due to ${draft.failureReason || "resource constraints"}.`,
//     feasibility: {
//       label: draft.techStack?.length > 4 ? "High" : "Medium",
//       note: `Feasible utilizing ${draft.techStack?.[0] || "existing web frameworks"}.`,
//     },
//     competition: {
//       label: "Medium",
//       note: "Standard competitive landscape in this domain.",
//     },
//     complexity: {
//       label: draft.techStack?.length > 5 ? "High" : "Medium",
//       note: `Requires integration of ${draft.techStack?.slice(0, 2).join(" and ") || "frontend and backend components"}.`,
//     },
//     scalability: {
//       label: "Medium",
//       note: "Scale can be improved by containerizing services.",
//     },
//     market: {
//       headline: "Niche market opportunity",
//       note: `Targeted solution for ${draft.domain} related use cases.`,
//     },
//     recommendations: [
//       `Refactor the codebase to clean up the ${draft.techStack?.[0] || "frontend"} architecture.`,
//       `Create a minimal prototype focusing only on solving the core ${draft.failureReason || "blockers"}.`,
//       `Establish a clearer roadmap to prevent further scope creep.`,
//     ],
//     techStack: {
//       frontend: draft.techStack?.[0] || "React",
//       backend: draft.techStack?.[1] || "Node.js",
//       database: draft.techStack?.[2] || "MongoDB",
//       ai: "Gemini API",
//       hosting: "Vercel / AWS",
//     },
//     roadmap: [
//       { week: "Week 1", label: "Analyze legacy code & plan MVP" },
//       { week: "Week 2", label: `Implement core ${draft.techStack?.[0] || "features"}` },
//       { week: "Week 3", label: "Resolve previous stall blockers" },
//       { week: "Week 4", label: "Deployment & Initial Feedback" },
//     ],
//     finalNote: "A highly promising draft with a solid foundation. Addressing the core blocker will unlock immediate value.",
//   };
// }

// function OverviewTab({
//   draft,
//   workspace,
//   tasks,
//   teamData,
//   onViewFullSuggestion,
// }: {
//   draft: Draft | null;
//   workspace: WorkspaceData;
//   tasks: TaskData[];
//   teamData: TeamResponseData | null;
//   onViewFullSuggestion: () => void;
// }) {
//   const [aiAnalysis, setAiAnalysis] = useState<AiIdeaAnalysis | null>(null);
//   const [loadingAi, setLoadingAi] = useState(false);
//   const [activityOpen, setActivityOpen] = useState(false);

//   useEffect(() => {
//     if (!draft) return;
//     setLoadingAi(true);
//     fetchAiIdeaAnalysis({
//       projectName: draft.projectName,
//       pitch: draft.oneLiner,
//       context: `Tech Stack: ${draft.techStack?.join(", ") || "None"}. Failure Reason: ${draft.failureReason || "None"}.`,
//     })
//       .then((data) => {
//         setAiAnalysis(data);
//       })
//       .catch((err) => {
//         console.error("Failed to fetch AI analysis:", err);
//         setAiAnalysis(generateFallbackAnalysis(draft));
//       })
//       .finally(() => {
//         setLoadingAi(false);
//       });
//   }, [draft]);

//   const activeAnalysis = aiAnalysis || (draft ? generateFallbackAnalysis(draft) : null);

//   const stallReasonDescriptions: Record<string, string> = {
//     "scope creep": "The project grew beyond its initial scope, leading to delayed progress and lost focus.",
//     "lack of budget": "Insufficient funding to sustain development, server hosting, or API costs.",
//     "no market need": "The core product value proposition didn't align with actual user demand or market fit.",
//     "team split": "Key contributors left or the team lost alignment on product direction.",
//     "technical debt": "Accumulated codebase complexity made adding new features too slow and error-prone.",
//     "lack of time": "The contributors had other commitments and could not dedicate enough time to execute.",
//     "marketing failure": "The team was unable to reach or acquire early users to validate the product.",
//     "poor execution": "Technical challenges or design issues prevented shipping a functional product."
//   };

//   const failureReasonRaw = draft?.failureReason || "Scope Creep";
//   const failureReasonKey = failureReasonRaw.toLowerCase();
//   const failureDescription = stallReasonDescriptions[failureReasonKey] || `The project stalled due to ${failureReasonRaw}.`;

//   const confidenceScore = activeAnalysis?.score || 91;

//   // Snapshot metrics
//   const totalTasks = tasks.length;
//   const doneTasks = tasks.filter((t) => t.status === "Done").length;
//   const fileSeed = draft?._id ? parseInt(draft._id.slice(-3), 16) : 42;
//   const simulatedFiles = isNaN(fileSeed) ? 18 : (fileSeed % 15) + 8 + (draft?.techStack?.length || 0) * 3;
//   const simulatedCommits = isNaN(fileSeed) ? 132 : (fileSeed % 120) + 40 + doneTasks * 5;

//   // Unified activity generator
//   const activities: Array<{
//     icon: any;
//     tone: string;
//     what: string;
//     when: string;
//     rawDate: number;
//   }> = [];

//   // Add stage activity
//   if (draft) {
//     activities.push({
//       icon: CheckCircle2,
//       tone: "text-[color:var(--revive)]",
//       what: `Stage updated to ${draft.currentStage}`,
//       when: "recently",
//       rawDate: draft.updatedAt ? new Date(draft.updatedAt).getTime() : Date.now(),
//     });
//   }

//   // Add task updates
//   tasks.forEach((task) => {
//     activities.push({
//       icon: task.status === "Done" ? CheckCircle2 : Circle,
//       tone: task.status === "Done" ? "text-[color:var(--revive)]" : "text-muted-foreground",
//       what: `Task "${task.title}" is ${task.status.toLowerCase()}`,
//       when: task.updatedAt ? formatTimeAgo(task.updatedAt) : "recently",
//       rawDate: task.updatedAt ? new Date(task.updatedAt).getTime() : 0,
//     });
//   });

//   // Add team activity logs
//   (teamData?.activity || []).forEach((act) => {
//     activities.push({
//       icon: act.what.includes("stage") ? CheckCircle2 : UserPlus,
//       tone: "text-primary",
//       what: `${act.who} ${act.what}`,
//       when: act.when,
//       rawDate: 0,
//     });
//   });

//   // Sort: newest rawDate items first
//   activities.sort((a, b) => b.rawDate - a.rawDate);

//   // Fallbacks if empty
//   if (activities.length === 0) {
//     activities.push(
//       {
//         icon: GitPullRequest,
//         tone: "text-primary",
//         what: `Code repository initialized with ${draft?.techStack?.[0] || "React"}`,
//         when: "3d ago",
//         rawDate: 0,
//       },
//       {
//         icon: UserPlus,
//         tone: "text-primary",
//         what: "Project draft created and shared",
//         when: "4d ago",
//         rawDate: 0,
//       }
//     );
//   }

//   // Tags
//   const tags = draft?.techStack || ["React", "Node.js", "MongoDB"];

//   // Blocker / Completed tasks notes layout
//   const completedTasks = tasks.filter((t) => t.status === "Done");
//   let noteContent: ReactNode;
//   if (completedTasks.length > 0) {
//     noteContent = (
//       <div className="space-y-2">
//         <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
//           Recently Completed Tasks
//         </p>
//         <ul className="space-y-1.5">
//           {completedTasks.slice(0, 3).map((t: TaskData) => (
//             <li key={t._id} className="flex items-start gap-2">
//               <CheckCircle2 className="h-4 w-4 text-[color:var(--revive)] shrink-0 mt-0.5" />
//               <div className="text-sm">
//                 <span className="font-semibold text-foreground">{t.title}</span>
//                 {t.description && (
//                   <span className="text-muted-foreground text-xs block truncate max-w-lg">
//                     {t.description}
//                   </span>
//                 )}
//               </div>
//             </li>
//           ))}
//         </ul>
//       </div>
//     );
//   } else {
//     noteContent = (
//       <p className="text-sm leading-relaxed text-muted-foreground">
//         {workspace?.currentBlockers || "No blockers reported yet. Click on Tasks to add things to do."}
//       </p>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Row 1: Why It Stalled · What's Next */}
//       <div className="grid gap-6 lg:grid-cols-2">
//         <Card title="Why It Stalled">
//           <div className="flex items-start gap-2">
//             <Badge className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive/15">
//               {failureReasonRaw}
//             </Badge>
//           </div>
//           <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
//             {failureDescription}
//           </p>
//           <div className="mt-5">
//             <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
//               <span>Confidence</span>
//               <span className="text-foreground">{confidenceScore}%</span>
//             </div>
//             <Progress value={confidenceScore} className="mt-2 h-1.5" />
//           </div>
//         </Card>

//         <Card title="What's Next (AI)">
//           {loadingAi ? (
//             <div className="space-y-3 animate-pulse">
//               <div className="h-6 bg-muted rounded w-3/4" />
//               <div className="h-4 bg-muted rounded w-5/6" />
//               <div className="h-4 bg-muted rounded w-2/3" />
//               <div className="h-10 bg-muted rounded-full w-full mt-5" />
//             </div>
//           ) : (
//             <>
//               <div className="flex items-start gap-3">
//                 <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tint-lilac">
//                   <Lightbulb className="h-4 w-4" />
//                 </span>
//                 <div>
//                   <h3 className="font-display text-base font-semibold leading-tight">
//                     {activeAnalysis?.recommendations?.[0] || "Analyze Next Steps"}
//                   </h3>
//                   <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
//                     {activeAnalysis?.recommendations?.[1] || "Evaluate draft roadmap and check for key blockers."}
//                   </p>
//                 </div>
//               </div>
//               <Button
//                 className="mt-5 h-9 w-full rounded-full"
//                 onClick={onViewFullSuggestion}
//               >
//                 View Full Suggestion <ArrowRight className="ml-1 h-4 w-4" />
//               </Button>
//             </>
//           )}
//         </Card>
//       </div>

//       {/* Row 2: Project Snapshot · Top Activity */}
//       <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
//         <Card title="Project Snapshot">
//           <div className="grid grid-cols-4 gap-3">
//             {[
//               { label: "Tasks", value: `${totalTasks}`, sub: `${doneTasks} done` },
//               { label: "Contributors", value: draft?.teamSize || "1", sub: "active" },
//               { label: "Files", value: `${simulatedFiles}` },
//               { label: "Commits", value: `${simulatedCommits}` },
//             ].map((m) => (
//               <div key={m.label}>
//                 <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
//                   {m.label}
//                 </div>
//                 <div className="mt-1 font-display text-xl font-semibold leading-none">
//                   {m.value}
//                 </div>
//                 {m.sub && <div className="mt-1 text-[11px] text-muted-foreground">{m.sub}</div>}
//               </div>
//             ))}
//           </div>
//           <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
//             <Clock className="h-3.5 w-3.5" /> Updated recently
//           </div>
//         </Card>

//         <Card
//           title="Top Activity (Last 7 Days)"
//           action={
//             <button className="text-muted-foreground transition-colors duration-[180ms] hover:text-foreground">
//               <Plus className="h-3.5 w-3.5" />
//             </button>
//           }
//         >
//           <ul className="divide-y divide-border/60">
//             {activities.slice(0, 3).map((a, i) => (
//               <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
//                 <a.icon className={`h-3.5 w-3.5 shrink-0 ${a.tone}`} />
//                 <span className="flex-1 truncate text-sm">{a.what}</span>
//                 <span className="text-xs text-muted-foreground">{a.when}</span>
//               </li>
//             ))}
//           </ul>

//           <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
//             <button
//               onClick={() => setActivityOpen(true)}
//               className="mt-3 text-xs font-medium text-primary transition-colors duration-[180ms] hover:text-primary/80"
//             >
//               View all activity
//             </button>
//             <DialogContent className="sm:max-w-md bg-card text-foreground border border-border">
//               <DialogHeader>
//                 <DialogTitle>All Project Activity</DialogTitle>
//                 <DialogDescription>
//                   Recent updates, task status changes, and collaborator actions for this workspace.
//                 </DialogDescription>
//               </DialogHeader>
//               <div className="max-h-80 overflow-y-auto space-y-4 pr-1 mt-2">
//                 {activities.length > 0 ? (
//                   <ul className="divide-y divide-border/60">
//                     {activities.map((a, i) => (
//                       <li key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 border-b border-border/60 last:border-0">
//                         <a.icon className={`h-4 w-4 shrink-0 mt-0.5 ${a.tone}`} />
//                         <div className="min-w-0 flex-1">
//                           <p className="text-sm text-foreground leading-snug">{a.what}</p>
//                           <p className="text-xs text-muted-foreground mt-0.5">{a.when}</p>
//                         </div>
//                       </li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <div className="text-center py-6 text-sm text-muted-foreground">
//                     No activity recorded yet.
//                   </div>
//                 )}
//               </div>
//             </DialogContent>
//           </Dialog>
//         </Card>
//       </div>

//       {/* Row 3: Recent Notes · Tags */}
//       <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
//         <Card title="Recent Notes">
//           {noteContent}
//           <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
//             <span>─ System note</span>
//             <span className="text-muted-foreground/50">·</span>
//             <span>Recently updated</span>
//           </div>
//         </Card>

//         <Card title="Tags">
//           <div className="flex flex-wrap gap-2">
//             {tags.map((t) => (
//               <Badge
//                 key={t}
//                 variant="outline"
//                 className="rounded-full border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
//               >
//                 {t}
//               </Badge>
//             ))}
//           </div>
//         </Card>
//       </div>
//     </div>
//   );
// }

// function formatTimeAgo(dateString: string) {
//   const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
//   let interval = Math.floor(seconds / 31536000);
//   if (interval >= 1) return interval + "y ago";
//   interval = Math.floor(seconds / 2592000);
//   if (interval >= 1) return interval + "mo ago";
//   interval = Math.floor(seconds / 86400);
//   if (interval >= 1) return interval + "d ago";
//   interval = Math.floor(seconds / 3600);
//   if (interval >= 1) return interval + "h ago";
//   interval = Math.floor(seconds / 60);
//   if (interval >= 1) return interval + "m ago";
//   return seconds < 10 ? "just now" : Math.floor(seconds) + "s ago";
// }

// function DraftCompassMini({ analysis }: { analysis: AiIdeaAnalysis }) {
//   const getScore = (label: "High" | "Medium" | "Low") => {
//     if (label === "High") return 85;
//     if (label === "Medium") return 65;
//     return 45;
//   };

//   const axes = [
//     { label: "Feasibility", value: getScore(analysis.feasibility.label) },
//     { label: "Competition", value: getScore(analysis.competition.label) },
//     { label: "Complexity", value: getScore(analysis.complexity.label) },
//     { label: "Scalability", value: getScore(analysis.scalability.label) },
//   ];
//   const cx = 70;
//   const cy = 70;
//   const rMax = 56;
//   const N = axes.length;
//   const angle = (i: number) => (i / N) * Math.PI * 2 - Math.PI / 2;
//   const pt = (i: number, v: number) => {
//     const r = (v / 100) * rMax;
//     return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))] as const;
//   };
//   const poly = axes.map((a, i) => pt(i, a.value).join(",")).join(" ");
//   const rings = [0.33, 0.66, 1];

//   return (
//     <div className="flex items-center gap-5">
//       <svg viewBox="0 0 140 140" className="h-32 w-32 shrink-0">
//         {rings.map((k) => (
//           <circle
//              key={k}
//              cx={cx}
//              cy={cy}
//              r={rMax * k}
//              fill="none"
//              stroke="var(--border)"
//              strokeWidth={1}
//              opacity={0.6}
//            />
//          ))}
//          {axes.map((_, i) => {
//            const [x, y] = pt(i, 100);
//            return (
//              <line
//                key={i}
//                x1={cx}
//                y1={cy}
//                x2={x}
//                y2={y}
//                stroke="var(--border)"
//                strokeWidth={1}
//                opacity={0.5}
//              />
//            );
//          })}
//          <polygon
//            points={poly}
//            fill="var(--primary)"
//            fillOpacity={0.18}
//            stroke="var(--primary)"
//            strokeWidth={1.5}
//          />
//          {axes.map((a, i) => {
//            const [x, y] = pt(i, a.value);
//            return <circle key={a.label} cx={x} cy={y} r={2.5} fill="var(--primary)" />;
//          })}
//        </svg>

//        <ul className="flex-1 space-y-2 text-sm">
//          {axes.map((a) => (
//            <li key={a.label} className="flex items-center justify-between">
//              <span className="text-muted-foreground">{a.label}</span>
//              <span className="font-medium text-foreground">{a.value}%</span>
//            </li>
//          ))}
//        </ul>
//      </div>
//   );
// }

// function DraftCard({
//   draft,
//   onClick,
//   rolePillClass,
// }: {
//   draft: any;
//   onClick: () => void;
//   rolePillClass?: (role: string) => string;
// }) {
//   const progress = stageToProgress(draft.currentStage);
//   const updatedAt = new Date(draft.updatedAt || draft.createdAt).toLocaleDateString();
//   const role = draft.userRole || (draft.isOwner ? "Owner" : "Owner");

//   return (
//     <button
//       onClick={onClick}
//       className="w-full text-left rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl p-4 sm:p-5 hover:border-primary/30 hover:bg-card/70 transition-all group"
//     >
//       <div className="flex items-start gap-4">
//         <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-primary">
//           {draft.projectName.slice(0, 2).toUpperCase()}
//         </div>

//         <div className="flex-1 min-w-0">
//           <div className="flex items-start justify-between gap-3">
//             <div className="min-w-0">
//               <div className="flex items-center gap-2 flex-wrap">
//                 <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
//                   {draft.projectName}
//                 </h3>
//                 <span
//                   className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
//                     rolePillClass
//                       ? rolePillClass(role)
//                       : "bg-primary/15 text-primary border-primary/30"
//                   }`}
//                 >
//                   <Crown className="h-2.5 w-2.5" />
//                   {role}
//                 </span>
//               </div>
//               <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{draft.oneLiner}</p>
//             </div>
//             <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
//           </div>


//           <div className="flex flex-wrap items-center gap-3 mt-3">
//             <Badge variant="secondary" className="text-[10px] rounded-md">{draft.currentStage}</Badge>
//             <div className="flex gap-1.5">
//               {draft.techStack.slice(0, 2).map((tech: string, i: number) => (
//                 <Badge key={i} variant="outline" className="text-[10px] rounded-md">
//                   {(tech.split("/").pop() ?? tech).slice(0, 8)}
//                 </Badge>
//               ))}
//               {draft.techStack.length > 2 && (
//                 <Badge variant="outline" className="text-[10px] rounded-md">+{draft.techStack.length - 2}</Badge>
//               )}
//             </div>
//             <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
//               <Calendar className="h-3 w-3" /> {updatedAt}
//             </div>
//           </div>

//           <div className="mt-3 space-y-1">
//             <div className="flex items-center justify-between text-[10px]">
//               <span className="text-muted-foreground">Progress</span>
//               <span className="font-medium">{progress}%</span>
//             </div>
//             <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
//               <div className="h-full bg-gradient-to-r from-primary to-purple-500" style={{ width: `${progress}%` }} />
//             </div>
//           </div>
//         </div>
//       </div>
//     </button>
//   );
// }

// function SharedDraftCard({
//   draft,
//   onClick,
//   onLeave,
//   rolePillClass,
// }: {
//   draft: any;
//   onClick: () => void;
//   onLeave: () => void;
//   rolePillClass: (role: string) => string;
// }) {
//   const progress = stageToProgress(draft.currentStage);
//   const updatedAt = new Date(draft.updatedAt || draft.createdAt).toLocaleDateString();
//   const role: string = draft._sharedRole || "Contributor";
//   const ownerName: string = draft._ownerName || (typeof draft.submittedBy === "object" ? draft.submittedBy?.name || "Unknown" : "Unknown");

//   return (
//     <div className="relative w-full group">
//       {/* Shared indicator left border */}
//       <div
//         className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
//           role === "Contributor" ? "bg-violet-500/70" : "bg-sky-500/70"
//         }`}
//       />
//       <button
//         onClick={onClick}
//         className="w-full text-left rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl p-4 sm:p-5 pl-5 hover:border-primary/30 hover:bg-card/70 transition-all"
//       >
//         <div className="flex items-start gap-4">
//           <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-violet-500/20 to-sky-500/20 flex items-center justify-center text-sm font-bold text-violet-600 dark:text-violet-400">
//             {draft.projectName.slice(0, 2).toUpperCase()}
//           </div>

//           <div className="flex-1 min-w-0">
//             <div className="flex items-start justify-between gap-3">
//               <div className="min-w-0">
//                 <div className="flex items-center gap-2 flex-wrap">
//                   <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
//                     {draft.projectName}
//                   </h3>
//                   {/* Role pill */}
//                   <span
//                     className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rolePillClass(role)}`}
//                   >
//                     {role === "Contributor" ? (
//                       <Edit3 className="h-2.5 w-2.5" />
//                     ) : (
//                       <Lock className="h-2.5 w-2.5" />
//                     )}
//                     {role}
//                   </span>
//                   {/* Shared indicator */}
//                   <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
//                     <Users className="h-3 w-3" />
//                     <span>by <span className="font-medium text-foreground">{ownerName}</span></span>
//                   </span>
//                 </div>
//                 <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{draft.oneLiner}</p>
//               </div>
//               {/* Overflow menu */}
//               <div onClick={(e) => e.stopPropagation()}>
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <button className="h-7 w-7 flex items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors">
//                       <MoreHorizontal className="h-3.5 w-3.5" />
//                     </button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="end" className="w-44">
//                     <DropdownMenuItem onClick={onClick}>
//                       Open workspace
//                     </DropdownMenuItem>
//                     <DropdownMenuSeparator />
//                     <DropdownMenuItem
//                       className="text-rose-500 focus:text-rose-500"
//                       onClick={onLeave}
//                     >
//                       <LogOut className="mr-2 h-3.5 w-3.5" />
//                       Leave workspace
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </div>
//             </div>

//             <div className="flex flex-wrap items-center gap-3 mt-3">
//               <Badge variant="secondary" className="text-[10px] rounded-md">{draft.currentStage}</Badge>
//               <Badge variant="outline" className="text-[10px] rounded-md capitalize">{draft.domain}</Badge>
//               <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
//                 <Calendar className="h-3 w-3" /> {updatedAt}
//               </div>
//             </div>

//             <div className="mt-3 space-y-1">
//               <div className="flex items-center justify-between text-[10px]">
//                 <span className="text-muted-foreground">Progress</span>
//                 <span className="font-medium">{progress}%</span>
//               </div>
//               <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
//                 <div
//                   className={`h-full ${role === "Contributor" ? "bg-gradient-to-r from-violet-500 to-primary" : "bg-gradient-to-r from-sky-400 to-sky-600"}`}
//                   style={{ width: `${progress}%` }}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </button>
//     </div>
//   );
// }

// function EmptyState() {
//   return (
//     <div className="flex flex-col items-center justify-center py-16 px-4 relative">
//       <div className="absolute inset-0 -z-10 opacity-30">
//         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/20 blur-[100px]" />
//       </div>

//       <div className="rounded-3xl border border-border/40 bg-card/45 backdrop-blur-xl p-8 sm:p-12 text-center max-w-md">
//         <Zap className="h-12 w-12 text-primary/60 mx-auto mb-4" />
//         <h2 className="font-display text-2xl font-semibold">You don't have any drafts yet.</h2>
//         <p className="mt-2 text-sm text-muted-foreground">Create your first draft to start building.</p>
//         <Button asChild className="mt-6 rounded-xl gap-2">
//           <Link to="/new-draft"><Plus className="h-4 w-4" /> Create New Draft</Link>
//         </Button>
//       </div>
//     </div>
//   );
// }



// // ─────────────────────────────────────────────────────────────────────────────
// // TASKS TAB
// // ─────────────────────────────────────────────────────────────────────────────

// function TasksTab({
//   draftId,
//   tasks,
//   refreshTasks,
//   loading,
// }: {
//   draftId: string | undefined;
//   tasks: TaskData[];
//   refreshTasks: () => void;
//   loading: boolean;
// }) {
//   const [view, setView] = useState<"list" | "board">("list");
//   const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

//   useEffect(() => {
//     if (tasks.length > 0 && !selectedTaskId) {
//       setSelectedTaskId(tasks[0]._id!);
//     }
//   }, [tasks, selectedTaskId]);

//   const [createOpen, setCreateOpen] = useState(false);

//   // Create task form states
//   const [newTitle, setNewTitle] = useState("");
//   const [newDesc, setNewDesc] = useState("");
//   const [newPriority, setNewPriority] = useState<"High" | "Medium" | "Low">("Medium");
//   const [newAssignee, setNewAssignee] = useState("");
//   const [newLabels, setNewLabels] = useState("");
//   const [newChecklistText, setNewChecklistText] = useState("");
//   const [newDueDate, setNewDueDate] = useState("");
//   const [newLinkedPR, setNewLinkedPR] = useState("");
//   const [newDependencies, setNewDependencies] = useState("");

//   const handleCreateTask = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!draftId || !newTitle.trim()) return;

//     const checklistItems = newChecklistText
//       .split("\n")
//       .map(item => item.trim())
//       .filter(Boolean)
//       .map(text => ({ text, completed: false }));

//     createTask({
//       draftId,
//       title: newTitle,
//       description: newDesc,
//       status: "Todo",
//       priority: newPriority,
//       assignee: newAssignee,
//       labels: newLabels.split(",").map((l: string) => l.trim()).filter(Boolean),
//       checklist: checklistItems,
//       dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
//       linkedPR: newLinkedPR,
//       dependencies: newDependencies
//     })
//       .then((created: TaskData) => {
//         toast.success("Task created successfully!");
//         setCreateOpen(false);
//         setNewTitle("");
//         setNewDesc("");
//         setNewPriority("Medium");
//         setNewAssignee("");
//         setNewLabels("");
//         setNewChecklistText("");
//         setNewDueDate("");
//         setNewLinkedPR("");
//         setNewDependencies("");
//         refreshTasks();
//       })
//       .catch((err: any) => {
//         toast.error(err.message ?? "Failed to create task");
//       });
//   };

//   const handleUpdateStatus = (taskId: string, status: "Todo" | "In Progress" | "Done") => {
//     updateTask(taskId, { status })
//       .then(() => {
//         refreshTasks();
//       })
//       .catch((err: any) => {
//         toast.error(err.message ?? "Failed to update status");
//       });
//   };

//   const selectedTask = tasks.find(t => t._id === selectedTaskId) || tasks[0];

//   if (loading && tasks.length === 0) {
//     return (
//       <div className="flex h-64 items-center justify-center">
//         <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
//       </div>
//     );
//   }

//   return (
//     <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
//       {/* LEFT — task list */}
//       <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm flex flex-col justify-between min-h-[500px]">
//         <div>
//           <div className="flex items-center justify-between px-2">
//             <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
//               Tasks
//             </h2>
//             <div className="flex items-center gap-1 rounded-full border border-border bg-background p-0.5 text-[11px]">
//               {(["list", "board"] as const).map((v) => (
//                 <button
//                   key={v}
//                   onClick={() => setView(v)}
//                   className={`rounded-full px-2.5 py-1 font-medium capitalize transition-colors duration-[180ms] ${
//                     view === v
//                       ? "bg-primary text-primary-foreground"
//                       : "text-muted-foreground hover:text-foreground"
//                   }`}
//                 >
//                   {v}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="mt-4 space-y-5">
//             {tasks.length === 0 ? (
//               <div className="text-center py-12 text-sm text-muted-foreground">
//                 No tasks created yet. Click below to add one.
//               </div>
//             ) : (
//               (["In Progress", "Todo", "Done"] as const).map((section) => {
//                 const items = tasks.filter((t) => t.status === section);
//                 if (items.length === 0 && view === "board") return null;
//                 return (
//                   <div key={section}>
//                     <div className="flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
//                       <span>{section}</span>
//                       <span>{items.length}</span>
//                     </div>
//                     <ul className="mt-2 space-y-1">
//                       {items.map((t) => {
//                         const active = t._id === selectedTaskId;
//                         return (
//                           <li key={t._id}>
//                             <button
//                               onClick={() => setSelectedTaskId(t._id!)}
//                               className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-[180ms] ${
//                                 active ? "bg-primary/8 ring-1 ring-primary/30" : "hover:bg-muted/60"
//                               }`}
//                             >
//                               <span
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   const nextStatus = t.status === "Done" ? "Todo" : "Done";
//                                   handleUpdateStatus(t._id!, nextStatus);
//                                 }}
//                                 className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border cursor-pointer hover:border-primary/50 transition-colors ${
//                                   t.status === "Done"
//                                     ? "border-[color:var(--revive)] bg-[color:var(--revive)] text-white"
//                                     : t.status === "In Progress"
//                                       ? "border-primary text-primary"
//                                       : "border-border"
//                                 }`}
//                               >
//                                 {t.status === "Done" ? (
//                                   <CheckCircle2 className="h-3 w-3" />
//                                 ) : t.status === "In Progress" ? (
//                                   <span className="h-1.5 w-1.5 rounded-full bg-primary" />
//                                 ) : (
//                                   <Circle className="h-2.5 w-2.5 opacity-0" />
//                                 )}
//                               </span>
//                               <span
//                                 className={`flex-1 truncate text-sm ${
//                                   t.status === "Done" ? "text-muted-foreground line-through" : ""
//                                 }`}
//                               >
//                                 {t.title}
//                               </span>
//                               <PriorityChip p={t.priority} />
//                               <Avatar className="h-5 w-5 ring-1 ring-card">
//                                 <AvatarFallback className="bg-primary/15 text-[8px] font-semibold text-primary uppercase">
//                                   {t.assignee ? t.assignee.slice(0, 2) : "UN"}
//                                 </AvatarFallback>
//                               </Avatar>
//                             </button>
//                           </li>
//                         );
//                       })}
//                     </ul>
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         <Dialog open={createOpen} onOpenChange={setCreateOpen}>
//           <Button onClick={() => setCreateOpen(true)} variant="outline" size="sm" className="mt-4 w-full rounded-full">
//             <Plus className="mr-1 h-3.5 w-3.5" /> New task
//           </Button>
//           <DialogContent className="sm:max-w-lg bg-card text-foreground border border-border">
//             <DialogHeader>
//               <DialogTitle>Create Task</DialogTitle>
//               <DialogDescription>
//                 Add a new task to organize your workspace workflow.
//               </DialogDescription>
//             </DialogHeader>
//             <form onSubmit={handleCreateTask} className="space-y-4">
//               <div className="space-y-1">
//                 <label className="text-xs font-semibold text-muted-foreground">Title *</label>
//                 <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title..." required />
//               </div>
//               <div className="space-y-1">
//                 <label className="text-xs font-semibold text-muted-foreground">Description</label>
//                 <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What needs to be done?" rows={3} />
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold text-muted-foreground">Priority</label>
//                   <select
//                     value={newPriority}
//                     onChange={(e) => setNewPriority(e.target.value as any)}
//                     className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:outline-none"
//                   >
//                     <option value="Low">Low</option>
//                     <option value="Medium">Medium</option>
//                     <option value="High">High</option>
//                   </select>
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold text-muted-foreground">Assignee</label>
//                   <Input value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} placeholder="e.g. Ansh V." />
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold text-muted-foreground">Due Date</label>
//                   <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold text-muted-foreground">Labels (comma separated)</label>
//                   <Input value={newLabels} onChange={(e) => setNewLabels(e.target.value)} placeholder="e.g. Backend, Auth" />
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold text-muted-foreground">Dependencies</label>
//                   <Input value={newDependencies} onChange={(e) => setNewDependencies(e.target.value)} placeholder="e.g. Database Schema" />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold text-muted-foreground">Linked PR</label>
//                   <Input value={newLinkedPR} onChange={(e) => setNewLinkedPR(e.target.value)} placeholder="e.g. #45 Implement login" />
//                 </div>
//               </div>
//               <div className="space-y-1">
//                 <label className="text-xs font-semibold text-muted-foreground">Checklist Items (one per line)</label>
//                 <Textarea value={newChecklistText} onChange={(e) => setNewChecklistText(e.target.value)} placeholder="Setup login endpoint&#10;Validate inputs" rows={2} />
//               </div>
//               <DialogFooter className="pt-2">
//                 <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
//                   Cancel
//                 </Button>
//                 <Button type="submit">
//                   Create Task
//                 </Button>
//               </DialogFooter>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* RIGHT — task detail */}
//       {selectedTask ? (
//         <TaskDetail task={selectedTask} onUpdate={refreshTasks} />
//       ) : (
//         <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex items-center justify-center text-muted-foreground text-sm">
//           Select a task from the list to view its details.
//         </div>
//       )}
//     </div>
//   );
// }

// function PriorityChip({ p }: { p: Priority }) {
//   const cls =
//     p === "High"
//       ? "bg-destructive/10 text-destructive"
//       : p === "Medium"
//         ? "bg-tint-peach text-foreground"
//         : "bg-muted text-muted-foreground";
//   return (
//     <span
//       className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${cls}`}
//     >
//       {p}
//     </span>
//   );
// }

// function TaskDetail({ task, onUpdate }: { task: TaskData; onUpdate: () => void }) {
//   const [editOpen, setEditOpen] = useState(false);
//   const [commentText, setCommentText] = useState("");

//   const [editTitle, setEditTitle] = useState(task.title);
//   const [editDesc, setEditDesc] = useState(task.description);
//   const [editPriority, setEditPriority] = useState(task.priority);
//   const [editStatus, setEditStatus] = useState(task.status);
//   const [editAssignee, setEditAssignee] = useState(task.assignee);
//   const [editLabels, setEditLabels] = useState(task.labels.join(", "));
//   const [editDueDate, setEditDueDate] = useState(task.dueDate ? task.dueDate.split("T")[0] : "");
//   const [editLinkedPR, setEditLinkedPR] = useState(task.linkedPR);
//   const [editDependencies, setEditDependencies] = useState(task.dependencies);

//   useEffect(() => {
//     setEditTitle(task.title);
//     setEditDesc(task.description);
//     setEditPriority(task.priority);
//     setEditStatus(task.status);
//     setEditAssignee(task.assignee);
//     setEditLabels(task.labels.join(", "));
//     setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
//     setEditLinkedPR(task.linkedPR);
//     setEditDependencies(task.dependencies);
//   }, [task]);

//   const handleEditTask = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!task._id) return;

//     updateTask(task._id, {
//       title: editTitle,
//       description: editDesc,
//       priority: editPriority,
//       status: editStatus,
//       assignee: editAssignee,
//       labels: editLabels.split(",").map((l: string) => l.trim()).filter(Boolean),
//       dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
//       linkedPR: editLinkedPR,
//       dependencies: editDependencies
//     })
//       .then(() => {
//         toast.success("Task updated successfully!");
//         setEditOpen(false);
//         onUpdate();
//       })
//       .catch((err: any) => {
//         toast.error(err.message ?? "Failed to update task");
//       });
//   };

//   const handleDeleteTask = () => {
//     if (!task._id) return;
//     if (!confirm("Are you sure you want to delete this task?")) return;

//     deleteTask(task._id)
//       .then(() => {
//         toast.success("Task deleted successfully!");
//         onUpdate();
//       })
//       .catch((err: any) => {
//         toast.error(err.message ?? "Failed to delete task");
//       });
//   };

//   const handleToggleChecklist = (itemIndex: number) => {
//     if (!task._id) return;
//     const updatedChecklist = task.checklist.map((item: TaskChecklistItem, idx: number) =>
//       idx === itemIndex ? { ...item, completed: !item.completed } : item
//     );

//     updateTaskChecklist(task._id, updatedChecklist)
//       .then(() => {
//         onUpdate();
//       })
//       .catch((err: any) => {
//         toast.error(err.message ?? "Failed to update checklist");
//       });
//   };

//   const handleAddComment = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!task._id || !commentText.trim()) return;

//     addTaskComment(task._id, commentText)
//       .then(() => {
//         setCommentText("");
//         onUpdate();
//       })
//       .catch((err: any) => {
//         toast.error(err.message ?? "Failed to add comment");
//       });
//   };

//   const doneCount = task.checklist ? task.checklist.filter((c: TaskChecklistItem) => c.completed).length : 0;
//   const checklistLength = task.checklist ? task.checklist.length : 0;
//   const progressPercent = checklistLength > 0 ? (doneCount / checklistLength) * 100 : 0;

//   const formattedDueDate = task.dueDate 
//     ? new Date(task.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
//     : "No due date";

//   let aiSuggestionText = "Everything looks clear! Keep up the good work.";
//   let hasOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== "Done" : false;
//   let isUnassigned = !task.assignee;
//   let isHighPriorityBlocker = task.priority === "High" && task.status !== "Done";

//   if (hasOverdue) {
//     aiSuggestionText = `This task is overdue (${formattedDueDate}). Prioritize finishing it or update the due date to avoid staging delay.`;
//   } else if (isHighPriorityBlocker) {
//     aiSuggestionText = "This is a High Priority blocker. Assign all necessary resources here first before moving to other items.";
//   } else if (isUnassigned) {
//     aiSuggestionText = "This task has no assignee. Assign a team member to ensure someone takes ownership of this implementation.";
//   } else if (checklistLength > 0 && progressPercent < 50) {
//     aiSuggestionText = `Only ${doneCount}/${checklistLength} checklist items completed. Break this down and address the first uncompleted item.`;
//   } else if (task.status === "In Progress" && (!task.comments || task.comments.length === 0)) {
//     aiSuggestionText = "No comments or updates posted yet. Add a quick status update comment to align the team.";
//   }

//   return (
//     <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
//       <div className="flex flex-wrap items-start justify-between gap-3">
//         <div className="min-w-0">
//           <div className="flex flex-wrap items-center gap-2">
//             <h2 className="font-display text-[22px] font-semibold leading-tight tracking-tight">
//               {task.title}
//             </h2>
//             <PriorityChip p={task.priority} />
//             <Badge variant="secondary" className="rounded-full text-[10px]">
//               {task.status}
//             </Badge>
//           </div>
//           <p className="mt-2 text-xs text-muted-foreground">
//             Due: {formattedDueDate} {task.labels && task.labels.length > 0 && `· ${task.labels.join(", ")}`}
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Dialog open={editOpen} onOpenChange={setEditOpen}>
//             <Button onClick={() => setEditOpen(true)} variant="outline" size="sm" className="rounded-full">
//               <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
//             </Button>
//             <DialogContent className="sm:max-w-lg bg-card text-foreground border border-border">
//               <DialogHeader>
//                 <DialogTitle>Edit Task</DialogTitle>
//                 <DialogDescription>
//                   Modify the details of this task.
//                 </DialogDescription>
//               </DialogHeader>
//               <form onSubmit={handleEditTask} className="space-y-4">
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold text-muted-foreground">Title *</label>
//                   <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Task title..." required />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold text-muted-foreground">Description</label>
//                   <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="What needs to be done?" rows={3} />
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-1">
//                     <label className="text-xs font-semibold text-muted-foreground">Priority</label>
//                     <select
//                       value={editPriority}
//                       onChange={(e) => setEditPriority(e.target.value as any)}
//                       className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:outline-none"
//                     >
//                       <option value="Low">Low</option>
//                       <option value="Medium">Medium</option>
//                       <option value="High">High</option>
//                     </select>
//                   </div>
//                   <div className="space-y-1">
//                     <label className="text-xs font-semibold text-muted-foreground">Status</label>
//                     <select
//                       value={editStatus}
//                       onChange={(e) => setEditStatus(e.target.value as any)}
//                       className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:outline-none"
//                     >
//                       <option value="Todo">Todo</option>
//                       <option value="In Progress">In Progress</option>
//                       <option value="Done">Done</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-1">
//                     <label className="text-xs font-semibold text-muted-foreground">Assignee</label>
//                     <Input value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)} placeholder="e.g. Ansh V." />
//                   </div>
//                   <div className="space-y-1">
//                     <label className="text-xs font-semibold text-muted-foreground">Due Date</label>
//                     <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-1">
//                     <label className="text-xs font-semibold text-muted-foreground">Dependencies</label>
//                     <Input value={editDependencies} onChange={(e) => setEditDependencies(e.target.value)} placeholder="e.g. Database Schema" />
//                   </div>
//                   <div className="space-y-1">
//                     <label className="text-xs font-semibold text-muted-foreground">Linked PR</label>
//                     <Input value={editLinkedPR} onChange={(e) => setEditLinkedPR(e.target.value)} placeholder="e.g. #45 Implement login" />
//                   </div>
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold text-muted-foreground">Labels (comma separated)</label>
//                   <Input value={editLabels} onChange={(e) => setEditLabels(e.target.value)} placeholder="Backend, Auth" />
//                 </div>
//                 <DialogFooter className="pt-2">
//                   <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
//                     Cancel
//                   </Button>
//                   <Button type="submit">
//                     Save Changes
//                   </Button>
//                 </DialogFooter>
//               </form>
//             </DialogContent>
//           </Dialog>

//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
//                 <MoreHorizontal className="h-4 w-4" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
//               <DropdownMenuItem onClick={handleDeleteTask} className="text-destructive focus:text-destructive">
//                 Delete Task
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>

//       <Separator className="my-5" />

//       <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
//         <div className="space-y-6">
//           <section>
//             <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
//               Description
//             </div>
//             <p className="mt-2 text-sm leading-relaxed text-foreground">
//               {task.description || "No description provided."}
//             </p>
//           </section>

//           {checklistLength > 0 && (
//             <section>
//               <div className="flex items-center justify-between">
//                 <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
//                   Checklist
//                 </div>
//                 <span className="text-xs text-muted-foreground">
//                   {doneCount}/{checklistLength}
//                 </span>
//               </div>
//               <Progress value={progressPercent} className="mt-2 h-1.5" />
//               <ul className="mt-3 space-y-1.5">
//                 {task.checklist.map((c: TaskChecklistItem, idx: number) => (
//                   <li key={idx}>
//                     <button
//                       onClick={() => handleToggleChecklist(idx)}
//                       className="group flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors duration-[180ms] hover:bg-muted/60"
//                     >
//                       <span
//                         className={`grid h-4 w-4 place-items-center rounded border transition-colors duration-[180ms] ${
//                           c.completed ? "border-primary bg-primary text-primary-foreground" : "border-border"
//                         }`}
//                       >
//                         {c.completed && <CheckCircle2 className="h-3 w-3" />}
//                       </span>
//                       <span className={`text-sm ${c.completed ? "text-muted-foreground line-through" : ""}`}>
//                         {c.text}
//                       </span>
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             </section>
//           )}

//           <section>
//             <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
//               Comments
//             </div>
//             <div className="mt-3 space-y-3">
//               {task.comments && task.comments.length > 0 && (
//                 <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
//                   {task.comments.map((c: TaskComment, idx: number) => (
//                     <div key={idx} className="flex items-start gap-2.5">
//                       <Avatar className="h-7 w-7 ring-2 ring-card">
//                         <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary uppercase">
//                           {c.author.slice(0, 2)}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div className="flex-1 rounded-xl bg-muted/50 p-3">
//                         <div className="flex items-center justify-between text-xs">
//                           <span className="font-medium">{c.author}</span>
//                           <span className="text-muted-foreground">
//                             {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
//                           </span>
//                         </div>
//                         <p className="mt-1 text-sm leading-relaxed text-foreground">
//                           {c.text}
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//               <form onSubmit={handleAddComment} className="flex items-start gap-2.5">
//                 <Avatar className="h-7 w-7 ring-2 ring-card">
//                   <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary uppercase">
//                     ME
//                   </AvatarFallback>
//                 </Avatar>
//                 <div className="flex-1 flex gap-2">
//                   <Input
//                     placeholder="Write a comment…"
//                     value={commentText}
//                     onChange={(e) => setCommentText(e.target.value)}
//                     className="rounded-xl"
//                   />
//                   <Button type="submit" size="sm" className="rounded-xl">Comment</Button>
//                 </div>
//               </form>
//             </div>
//           </section>
//         </div>

//         {/* Right meta */}
//         <aside className="space-y-4">
//           <MetaRow label="Assignee">
//             <div className="flex items-center gap-2">
//               <Avatar className="h-6 w-6">
//                 <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary uppercase">
//                   {task.assignee ? task.assignee.slice(0, 2) : "UN"}
//                 </AvatarFallback>
//               </Avatar>
//               <span className="text-sm">{task.assignee || "Unassigned"}</span>
//             </div>
//           </MetaRow>
//           {task.labels && task.labels.length > 0 && (
//             <MetaRow label="Labels">
//               <div className="flex flex-wrap gap-1.5">
//                 {task.labels.map((l: string, idx: number) => (
//                   <Badge key={idx} variant="secondary" className="rounded-full text-[10px]">
//                     {l}
//                   </Badge>
//                 ))}
//               </div>
//             </MetaRow>
//           )}
//           <MetaRow label="Due">
//             <span className="text-sm">{formattedDueDate}</span>
//           </MetaRow>
//           {task.linkedPR && (
//             <MetaRow label="Linked PR">
//               <span className="inline-flex items-center gap-1.5 text-sm text-primary">
//                 <GitPullRequest className="h-3.5 w-3.5" /> {task.linkedPR}
//               </span>
//             </MetaRow>
//           )}
//           {task.dependencies && (
//             <MetaRow label="Dependencies">
//               <span className="text-sm">{task.dependencies}</span>
//             </MetaRow>
//           )}

//           <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
//             <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
//               <Sparkles className="h-3 w-3" /> AI Suggestion
//             </div>
//             <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
//               {aiSuggestionText}
//             </p>
//             <Button variant="ghost" size="sm" className="mt-2 h-7 rounded-full px-2 text-xs">
//               Ask AI <ArrowRight className="ml-1 h-3 w-3" />
//             </Button>
//           </div>
//         </aside>
//       </div>
//     </div>
//   );
// }

// function MetaRow({ label, children }: { label: string; children: ReactNode }) {
//   return (
//     <div>
//       <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
//         {label}
//       </div>
//       <div className="mt-1.5">{children}</div>
//     </div>
//   );
// }


// // ─────────────────────────────────────────────────────────────────────────────
// // STALL DNA TAB
// // ─────────────────────────────────────────────────────────────────────────────

// function StallDNATab() {
//   return (
//     <div className="grid gap-6 lg:grid-cols-3">
//       <Card title="Primary Stall Pattern" className="lg:col-span-1">
//         <h3 className="font-display text-lg font-semibold tracking-tight">Scope Creep Syndrome</h3>
//         <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
//           Strong signals of expanding scope beyond core value, causing delayed progress and context
//           switching.
//         </p>
//         <div className="mt-5 rounded-xl bg-muted/50 p-4">
//           <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
//             <span>Confidence</span>
//             <span className="text-foreground">91%</span>
//           </div>
//           <Progress value={91} className="mt-2 h-1.5" />
//         </div>
//       </Card>

//       <Card title="Similar Stalled Projects" className="lg:col-span-1">
//         <ul className="space-y-3">
//           {[
//             { name: "CampusConnect", stack: "React, Node.js, MongoDB", match: 91 },
//             { name: "QuizMaster", stack: "Flutter, Firebase", match: 87 },
//             { name: "EventHub", stack: "Next.js, PostgreSQL", match: 85 },
//           ].map((p) => (
//             <li
//               key={p.name}
//               className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
//             >
//               <div className="grid h-9 w-9 place-items-center rounded-lg bg-tint-lilac font-display text-[11px] font-bold">
//                 {p.name.slice(0, 2)}
//               </div>
//               <div className="min-w-0 flex-1">
//                 <p className="truncate text-sm font-medium">{p.name}</p>
//                 <p className="truncate text-xs text-muted-foreground">{p.stack}</p>
//               </div>
//               <Badge variant="secondary" className="rounded-full text-[10px]">
//                 {p.match}% match
//               </Badge>
//             </li>
//           ))}
//         </ul>
//       </Card>

//       <Card title="Most Successful Recovery" className="lg:col-span-1">
//         <h3 className="font-display text-base font-semibold tracking-tight">Lock the MVP scope</h3>
//         <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
//           Projects that defined a strict MVP and cut non-essential features had the highest success
//           rate.
//         </p>
//         <div className="mt-4 flex items-baseline gap-2">
//           <span className="font-display text-3xl font-semibold tracking-tight">78%</span>
//           <span className="text-xs text-muted-foreground">success rate</span>
//         </div>
//         <Button variant="outline" size="sm" className="mt-4 w-full rounded-full">
//           See Action Plan <ArrowRight className="ml-1 h-3.5 w-3.5" />
//         </Button>
//       </Card>

//       <Card title="Predicted Stall Factors" className="lg:col-span-2">
//         <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
//           {[
//             { label: "Scope Creep", level: "Very High" },
//             { label: "Vague Requirements", level: "High" },
//             { label: "Tech Overthinking", level: "Medium" },
//             { label: "Lack of Consistency", level: "Medium" },
//             { label: "Resource Constraints", level: "Low" },
//           ].map((f) => (
//             <li
//               key={f.label}
//               className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm"
//             >
//               <span>{f.label}</span>
//               <Badge variant="secondary" className="rounded-full text-[10px]">
//                 {f.level}
//               </Badge>
//             </li>
//           ))}
//         </ul>
//       </Card>

//       <Card title="Revival Probability">
//         <div className="flex items-baseline gap-2">
//           <span className="font-display text-4xl font-semibold tracking-tight">67%</span>
//           <span className="text-xs text-muted-foreground">if action taken now</span>
//         </div>
//         <Progress value={67} className="mt-3 h-1.5" />
//         <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
//           Based on 4 similar projects that made it past this stage.
//         </p>
//       </Card>

//       <Card title="Recovery Suggestions" className="lg:col-span-3">
//         <ul className="grid gap-3 md:grid-cols-3">
//           {[
//             {
//               icon: Flag,
//               title: "Define MVP boundary",
//               body: "List 3 features. Everything else is v2.",
//             },
//             {
//               icon: Rocket,
//               title: "Ship the login flow",
//               body: "Unblock testing and get end-to-end feedback.",
//             },
//             {
//               icon: Users,
//               title: "Weekly async standup",
//               body: "Short written updates to prevent context switching.",
//             },
//           ].map((s) => (
//             <li
//               key={s.title}
//               className="rounded-xl border border-border bg-background p-4 transition-all duration-[220ms] hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm"
//             >
//               <span className="grid h-9 w-9 place-items-center rounded-xl bg-tint-mint">
//                 <s.icon className="h-4 w-4" />
//               </span>
//               <p className="mt-3 text-sm font-medium">{s.title}</p>
//               <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
//             </li>
//           ))}
//         </ul>
//       </Card>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // TEAM TAB
// // ─────────────────────────────────────────────────────────────────────────────

// function TeamTab({
//   draftId,
//   teamData,
//   refreshTeam,
//   loading,
// }: {
//   draftId: string | undefined;
//   teamData: TeamResponseData | null;
//   refreshTeam: () => void;
//   loading: boolean;
// }) {
//   const { user } = useAuth();
//   const [inviteOpen, setInviteOpen] = useState(false);
//   const [inviteEmail, setInviteEmail] = useState("");
//   const [inviteRole, setInviteRole] = useState<"Contributor" | "Viewer">("Contributor");

//   const isCurrentUserOwner = teamData?.members?.some(
//     (m: TeamMemberData) => m.userId === user?._id && m.role === "Owner"
//   ) || false;

//   const myMember = teamData?.members?.find((m: TeamMemberData) => m.userId === user?._id);
//   const myRole = myMember?.role || "Viewer";

//   const handleInvite = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!draftId || !inviteEmail.trim()) return;

//     inviteTeamMember(draftId, inviteEmail, inviteRole)
//       .then(() => {
//         toast.success("Member invited successfully!");
//         setInviteOpen(false);
//         setInviteEmail("");
//         refreshTeam();
//       })
//       .catch((err: any) => {
//         toast.error(err.message ?? "Failed to invite member");
//       });
//   };

//   const handleUpdateRole = (userId: string, role: string) => {
//     if (!draftId) return;
//     updateTeamMemberRole(draftId, userId, role)
//       .then(() => {
//         toast.success("Role updated successfully!");
//         refreshTeam();
//       })
//       .catch((err: any) => {
//         toast.error(err.message ?? "Failed to update role");
//       });
//   };

//   const handleRemoveMember = (userId: string) => {
//     if (!draftId) return;
//     if (!confirm("Are you sure you want to remove this member?")) return;
//     removeTeamMember(draftId, userId)
//       .then(() => {
//         toast.success("Member removed successfully!");
//         refreshTeam();
//       })
//       .catch((err: any) => {
//         toast.error(err.message ?? "Failed to remove member");
//       });
//   };

//   const handleApproveRequest = (email: string) => {
//     if (!draftId) return;
//     approveJoinRequest(draftId, email)
//       .then(() => {
//         toast.success("Join request approved!");
//         refreshTeam();
//       })
//       .catch((err: any) => {
//         toast.error(err.message ?? "Failed to approve request");
//       });
//   };

//   const handleDeclineRequest = (email: string) => {
//     if (!draftId) return;
//     declineJoinRequest(draftId, email)
//       .then(() => {
//         toast.success("Join request declined!");
//         refreshTeam();
//       })
//       .catch((err: any) => {
//         toast.error(err.message ?? "Failed to decline request");
//       });
//   };

//   if (loading && !teamData) {
//     return (
//       <div className="flex h-64 items-center justify-center">
//         <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
//       </div>
//     );
//   }

//   return (
//     <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
//       <div className="space-y-6">
//         <Card
//           title="Contributors"
//           action={
//             isCurrentUserOwner && (
//               <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
//                 <Button onClick={() => setInviteOpen(true)} size="sm" className="h-8 rounded-full">
//                   <UserPlus className="mr-1 h-3.5 w-3.5" /> Invite
//                 </Button>
//                 <DialogContent className="sm:max-w-md bg-card text-foreground border border-border">
//                   <DialogHeader>
//                     <DialogTitle>Invite Contributor</DialogTitle>
//                     <DialogDescription>
//                       Invite a member to collaborate on this workspace. The user must be registered on DraftYard.
//                     </DialogDescription>
//                   </DialogHeader>
//                   <form onSubmit={handleInvite} className="space-y-4">
//                     <div className="space-y-1">
//                       <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
//                       <Input
//                         type="email"
//                         value={inviteEmail}
//                         onChange={(e) => setInviteEmail(e.target.value)}
//                         placeholder="collaborator@example.com"
//                         required
//                       />
//                     </div>
//                     <div className="space-y-1">
//                       <label className="text-xs font-semibold text-muted-foreground">Role</label>
//                       <select
//                         value={inviteRole}
//                         onChange={(e) => setInviteRole(e.target.value as any)}
//                         className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:outline-none"
//                       >
//                         <option value="Contributor">Contributor</option>
//                         <option value="Viewer">Viewer</option>
//                       </select>
//                     </div>
//                     <DialogFooter className="pt-2">
//                       <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>
//                         Cancel
//                       </Button>
//                       <Button type="submit">
//                         Send Invitation
//                       </Button>
//                     </DialogFooter>
//                   </form>
//                 </DialogContent>
//               </Dialog>
//             )
//           }
//         >
//           <ul className="divide-y divide-border/60">
//             {teamData?.members?.map((member: TeamMemberData) => {
//               const initials = member.name
//                 ? member.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
//                 : "UN";
//               const isMemberSelf = member.userId === user?._id;
//               return (
//                 <li key={member.userId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
//                   <Avatar className="h-9 w-9 ring-2 ring-card">
//                     <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary">
//                       {initials.slice(0, 2)}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div className="min-w-0 flex-1">
//                     <p className="truncate text-sm font-medium">
//                       {member.name} {isMemberSelf && <span className="text-xs text-muted-foreground">(You)</span>}
//                     </p>
//                     <p className="truncate text-xs text-muted-foreground">{member.email}</p>
//                   </div>
//                   <Badge variant="secondary" className="rounded-full text-[10px]">
//                     {member.role}
//                   </Badge>
//                   {isCurrentUserOwner && member.role !== "Owner" ? (
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
//                           <MoreHorizontal className="h-4 w-4" />
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
//                         <DropdownMenuItem
//                           onClick={() => handleUpdateRole(member.userId, "Contributor")}
//                           disabled={member.role === "Contributor"}
//                         >
//                           Make Contributor
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                           onClick={() => handleUpdateRole(member.userId, "Viewer")}
//                           disabled={member.role === "Viewer"}
//                         >
//                           Make Viewer
//                         </DropdownMenuItem>
//                         <DropdownMenuSeparator className="border-border" />
//                         <DropdownMenuItem
//                           className="text-destructive focus:text-destructive"
//                           onClick={() => handleRemoveMember(member.userId)}
//                         >
//                           Remove from team
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   ) : (
//                     <div className="w-8 h-8" />
//                   )}
//                 </li>
//               );
//             })}
//           </ul>
//         </Card>

//         <Card title="Pending Join Requests">
//           {teamData?.joinRequests && teamData.joinRequests.length > 0 ? (
//             <ul className="space-y-2">
//               {teamData.joinRequests.map((req: JoinRequestData) => (
//                 <li key={req.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
//                   <Avatar className="h-8 w-8">
//                     <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
//                       {req.name ? req.name.slice(0, 2).toUpperCase() : "RQ"}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div className="min-w-0 flex-1">
//                     <p className="truncate text-sm font-medium">{req.email}</p>
//                     <p className="text-xs text-muted-foreground">
//                       Requested {new Date(req.createdAt).toLocaleDateString()} · "{req.message || "Wants to join project"}"
//                     </p>
//                   </div>
//                   {isCurrentUserOwner ? (
//                     <div className="flex gap-2">
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         className="h-8 rounded-full"
//                         onClick={() => handleDeclineRequest(req.email)}
//                       >
//                         Decline
//                       </Button>
//                       <Button
//                         size="sm"
//                         className="h-8 rounded-full"
//                         onClick={() => handleApproveRequest(req.email)}
//                       >
//                         Approve
//                       </Button>
//                     </div>
//                   ) : (
//                     <span className="text-xs text-muted-foreground italic">Owner review pending</span>
//                   )}
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <div className="text-center py-6 text-sm text-muted-foreground">
//               No pending join requests.
//             </div>
//           )}
//         </Card>
//       </div>

//       <div className="space-y-6">
//         <Card title="Roles">
//           <ul className="space-y-2 text-sm">
//             {[
//               { role: "Owner", count: teamData?.members?.filter((m: TeamMemberData) => m.role === "Owner").length || 0 },
//               { role: "Contributor", count: teamData?.members?.filter((m: TeamMemberData) => m.role === "Contributor").length || 0 },
//               { role: "Viewer", count: teamData?.members?.filter((m: TeamMemberData) => m.role === "Viewer").length || 0 },
//             ].map((r) => (
//               <li key={r.role} className="flex items-center justify-between">
//                 <span>{r.role}</span>
//                 <span className="text-muted-foreground font-semibold">{r.count}</span>
//               </li>
//             ))}
//           </ul>
//         </Card>

//         <Card title="Permissions">
//           <ul className="space-y-2 text-sm">
//             {[
//               { icon: Shield, text: "Owners manage project settings", role: "Owner" },
//               { icon: UserPlus, text: "Owners invite / remove members", role: "Owner" },
//               { icon: Edit3, text: "Contributors edit tasks and files", role: "Contributor" },
//               { icon: Lock, text: "Viewers have read-only access", role: "Viewer" },
//             ].map((p, i) => {
//               const isActive = myRole === p.role;
//               return (
//                 <li
//                   key={i}
//                   className={`flex items-start gap-2 rounded-lg p-1.5 transition-all duration-[180ms] ${
//                     isActive
//                       ? "bg-primary/8 text-foreground ring-1 ring-primary/20"
//                       : "text-muted-foreground opacity-70"
//                   }`}
//                 >
//                   <p.icon className={`mt-0.5 h-3.5 w-3.5 ${isActive ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
//                   <span>{p.text} {isActive && " (Active)"}</span>
//                 </li>
//               );
//             })}
//           </ul>
//         </Card>

//         <Card title="Recent Team Activity">
//           {teamData?.activity && teamData.activity.length > 0 ? (
//             <ul className="space-y-3 text-sm">
//               {teamData.activity.slice(0, 5).map((a: ActivityLogData) => (
//                 <li key={a.id} className="flex items-start gap-2">
//                   <Avatar className="h-6 w-6">
//                     <AvatarFallback className="bg-primary/15 text-[9px] font-semibold text-primary">
//                       {a.initials}
//                     </AvatarFallback>
//                   </Avatar>
//                   <p className="text-xs leading-relaxed text-muted-foreground">
//                     <span className="font-medium text-foreground">{a.who}</span> {a.what}
//                     <span className="ml-1 text-muted-foreground/70">· {a.when}</span>
//                   </p>
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <div className="text-center py-6 text-sm text-muted-foreground">
//               No recent activity logs.
//             </div>
//           )}
//         </Card>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Floating AI
// // ─────────────────────────────────────────────────────────────────────────────

//   function FloatingAI({
//   open,
//   onOpenChange,
//   projectName,
//   aiContext,
// }: {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;
//   projectName: string;
//   aiContext?: any;
// }){
//     return (
//       <>
//         <motion.button
//           onClick={() => onOpenChange(true)}
//           initial={{ opacity: 0, scale: 0.9 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
//           className="fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition-all duration-[180ms] hover:-translate-y-0.5 hover:shadow-xl"
//           aria-label="Open AI Assistant"
//         >
//           <Bot className="h-5 w-5" />
//         </motion.button>

//         <Sheet open={open} onOpenChange={onOpenChange}>
//           <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
//             <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
//               <div className="flex items-center gap-2">
//                 <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
//                   <Bot className="h-4 w-4" />
//                 </span>
//                 <div>
//                   <p className="text-sm font-semibold leading-tight">AI Assistant</p>
//                   <p className="text-[11px] text-muted-foreground">Context: {projectName}</p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => onOpenChange(false)}
//                 className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors duration-[180ms] hover:bg-muted hover:text-foreground"
//               >
//                 <X className="h-4 w-4" />
//               </button>
//             </div>

//             <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
//               <div className="flex items-start gap-2.5">
//                 <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary">
//                   <Bot className="h-3.5 w-3.5" />
//                 </span>
//                 <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-3 py-2 text-sm leading-relaxed">
//                   Hi Dev — {projectName} is stalled on <span className="font-medium">Scope Creep</span>.
//                   Want me to draft a locked MVP scope?
//                 </div>
//               </div>

//               <div className="flex flex-wrap gap-1.5">
//                 {["Draft MVP scope", "Summarize open tasks", "Suggest next PR"].map((s) => (
//                   <button
//                     key={s}
//                     className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition-colors duration-[180ms] hover:border-primary/60 hover:bg-primary/5"
//                   >
//                     {s}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="border-t border-border/60 p-3">
//               <div className="flex items-center gap-2 rounded-full border border-border bg-background pl-3 pr-1 py-1 focus-within:ring-2 focus-within:ring-primary/30">
//                 <input
//                   className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
//                   placeholder="Ask about this project…"
//                 />
//                 <button className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-[180ms] hover:-translate-y-0.5">
//                   <Send className="h-3.5 w-3.5" />
//                 </button>
//               </div>
//             </div>
//           </SheetContent>
//         </Sheet>
//       </>
//     );
//   }
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronRight, Plus, Calendar, Zap } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Circle,
  Clock,
  Crown,
  Edit3,
  Flag,
  Github,
  GitPullRequest,
  Globe2,
  LayoutList,
  Lightbulb,
  LineChart,
  Link2,
  Lock,
  MoreHorizontal,
  Paperclip,
  Rocket,
  Send,
  Share2,
  Shield,
  Sparkles,
  UploadCloud,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMyDrafts } from "@/hooks/use-drafts";
import { stageToProgress } from "@/lib/drafts-insights";
import {
  fetchWorkspace,
  type WorkspaceData,
  fetchFeed,
  type Draft,
  navigateToWorkspace,
  fetchAiIdeaAnalysis,
  type AiIdeaAnalysis,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  updateTaskChecklist,
  type TaskData,
  type TaskChecklistItem,
  type TaskComment,
  fetchTeamData,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  approveJoinRequest,
  declineJoinRequest,
  updateDraftStage,
  type TeamMemberData,
  type JoinRequestData,
  type ActivityLogData,
  type TeamResponseData,
  sendAiChatMessage,
  leaveWorkspace,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Settings, UserCircle } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/workspace")({
  validateSearch: (search: Record<string, unknown>) => ({
    draftId: typeof search.draftId === "string" ? search.draftId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Workspace · DraftYard" },
      {
        name: "description",
        content: "Your workspace hub — manage all your drafts in one place.",
      },
      { property: "og:title", content: "DraftYard Workspace" },
    ],
  }),
  loader: async ({ location }) => {
    const params = location.search as { draftId?: string };
    const draftId = params.draftId;

    if (!draftId) {
      return { workspace: null, draft: null };
    }

    let workspace: WorkspaceData | null = null;
    let draft: Draft | null = null;

    try {
      workspace = await fetchWorkspace(draftId);
      const feedResponse = await fetchFeed();
      draft = feedResponse.data.find((d) => d._id === draftId) ?? null;
    } catch {
      workspace = null;
      draft = null;
    }

    return { workspace, draft, draftId };
  },
  component: WorkspacePage,
});

// ─────────────────────────────────────────────────────────────────────────────
// Static demo data (mirrors the reference)
// ─────────────────────────────────────────────────────────────────────────────

const STAGES = ["Idea", "Prototype", "Building", "Testing", "Shipped"] as const;
type Stage = (typeof STAGES)[number];

// Static contributors mock data removed; team database queries used instead.

type TaskStatus = "Todo" | "In Progress" | "Done";
type Priority = "High" | "Medium" | "Low";

// Static tasks mock data has been removed; database integration is used instead.

// Static activity mock data removed; activity logs are retrieved dynamically.

function WorkspacePage() {
  const { draftId } = Route.useSearch();
  const loaderData = Route.useLoaderData() as any;
  const { workspace, draft } = loaderData;

  if (draftId && workspace) {
    return <WorkspaceDetailPage workspace={workspace} draft={draft} />;
  }

  return <WorkspaceHomePage />;
}

function WorkspaceHomePage() {
  const { data: myDrafts = [], isLoading } = useMyDrafts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<"all" | "owned" | "shared">("all");

  const ownedDrafts = myDrafts.filter((d: any) => d.isOwner || (!d._sharedRole && d.userRole !== "Contributor" && d.userRole !== "Viewer"));
  const sharedDrafts = myDrafts.filter((d: any) => !d.isOwner && (d._sharedRole || d.userRole === "Contributor" || d.userRole === "Viewer"));

  const filteredDrafts = roleFilter === "owned"
    ? ownedDrafts
    : roleFilter === "shared"
      ? sharedDrafts
      : myDrafts;

  const handleLeaveWorkspace = async (d: any) => {
    if (!d._id) return;
    try {
      await leaveWorkspace(d._id);
      toast.success(`You have left "${d.projectName}".`);
      await queryClient.invalidateQueries({ queryKey: ["my-drafts"] });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to leave workspace");
    }
  };

  const rolePillClass = (role: string) => {
    if (role === "Owner")
      return "bg-primary/15 text-primary border-primary/30";
    if (role === "Contributor")
      return "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30";
    return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          <AppSidebar />
          <SidebarInset className="flex min-w-0 flex-1 flex-col">
            <TopBar showGreeting={false} />

            <main className="flex-1 space-y-8 p-4 sm:p-6">
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="text-foreground font-medium">Workspace</span>
              </nav>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight">Workspace Hub</h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {myDrafts.length === 0
                      ? "Create or join a workspace to start collaborating"
                      : `${myDrafts.length} workspace${myDrafts.length !== 1 ? "s" : ""} available (${ownedDrafts.length} owned, ${sharedDrafts.length} shared)`}
                  </p>
                </div>
                <Button asChild className="rounded-xl gap-2">
                  <Link to="/new-draft">
                    <Plus className="h-4 w-4" /> New Draft
                  </Link>
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <button
                  onClick={() => setRoleFilter("all")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${roleFilter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  All Workspaces ({myDrafts.length})
                </button>
                <button
                  onClick={() => setRoleFilter("owned")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${roleFilter === "owned"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  Owned ({ownedDrafts.length})
                </button>
                <button
                  onClick={() => setRoleFilter("shared")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${roleFilter === "shared"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  Shared with Me ({sharedDrafts.length})
                </button>
              </div>

              {/* Workspaces List */}
              <section className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 rounded-2xl bg-card/30 animate-pulse" />
                    ))}
                  </div>
                ) : filteredDrafts.length === 0 ? (
                  roleFilter === "shared" ? (
                    <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
                      <Users className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                      <h3 className="font-display text-base font-semibold">No Shared Workspaces Yet</h3>
                      <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                        When other project owners invite you as a Contributor or Viewer and you accept, their workspaces will appear here.
                      </p>
                    </div>
                  ) : (
                    <EmptyState />
                  )
                ) : (
                  <div className="space-y-3">
                    {filteredDrafts.map((d: any, i: number) => {
                      const isShared = !d.isOwner && (d._sharedRole || d.userRole === "Contributor" || d.userRole === "Viewer");
                      return (
                        <motion.div
                          key={d._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          {isShared ? (
                            <SharedDraftCard
                              draft={d}
                              onClick={() => navigateToWorkspace(d._id!, d.projectName, navigate, (msg) => toast.error(msg))}
                              onLeave={() => handleLeaveWorkspace(d)}
                              rolePillClass={rolePillClass}
                            />
                          ) : (
                            <DraftCard
                              draft={d}
                              onClick={() => navigateToWorkspace(d._id!, d.projectName, navigate, (msg) => toast.error(msg))}
                              rolePillClass={rolePillClass}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}


function WorkspaceDetailPage({ workspace, draft }: { workspace: WorkspaceData; draft: Draft | null }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"overview" | "tasks" | "team">("overview");
  const [available, setAvailable] = useState(true);
  const [stage, setStage] = useState<Stage>((draft?.currentStage as Stage) || "Building");
  const [pendingStage, setPendingStage] = useState<Stage | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [teamData, setTeamData] = useState<TeamResponseData | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);


  const isCurrentUserOwner =
    teamData?.members?.some(
      (m: TeamMemberData) => m.userId === user?._id && m.role === "Owner"
    ) || false;

  const myMemberRole =
    teamData?.members?.find(
      (m: TeamMemberData) => m.userId === user?._id
    )?.role || "Viewer";

  // Owner's name from team data
  const ownerMember = teamData?.members?.find((m: TeamMemberData) => m.role === "Owner");
  const ownerName = ownerMember?.name || draft?.submittedBy?.name || "";

  const isViewer =
    !isCurrentUserOwner && myMemberRole === "Viewer";

  const visibleTabs: Array<"overview" | "tasks" | "team"> =
    isViewer
      ? ["overview"]
      : ["overview", "tasks", "team"];

  useEffect(() => {
    if (draft?.currentStage) {
      setStage(draft.currentStage as Stage);
    }
  }, [draft?.currentStage]);

  useEffect(() => {
    if (isViewer && (tab === "tasks" || tab === "team")) {
      setTab("overview");
    }
  }, [isViewer, tab]);

  const refreshTeam = () => {
    if (!draft?._id) return;
    setLoadingTeam(true);
    fetchTeamData(draft._id)
      .then(setTeamData)
      .catch((err: any) => console.error("Error loading team:", err))
      .finally(() => setLoadingTeam(false));
  };

  useEffect(() => {
    refreshTeam();
  }, [draft?._id]);

  const refreshTasks = () => {
    if (!draft?._id) return;
    setLoadingTasks(true);
    fetchTasks(draft._id)
      .then(setTasks)
      .catch((err: any) => console.error("Error loading tasks:", err))
      .finally(() => setLoadingTasks(false));
  };

  useEffect(() => {
    refreshTasks();
  }, [draft?._id]);

  const projectName = draft?.projectName || "Project";

  const aiContext = {
    draft,
    tasks,
    teamData,
    activityLog: teamData?.activity ?? [],
  };
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          <AppSidebar />
          <SidebarInset className="flex min-w-0 flex-1 flex-col">
            <WorkspaceTopBar projectName={projectName} />

            <motion.main
              className="flex-1 space-y-6 p-4 sm:p-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProjectHeader
                stage={stage}
                onStageClick={(s) => setPendingStage(s)}
                available={available}
                onAvailableChange={setAvailable}
                projectName={projectName}
                description={draft?.oneLiner || ""}
                members={teamData?.members || []}
                ownerName={ownerName}
                userRole={myMemberRole}
                raisedHandsCount={draft?.raisedHands?.length || 0}
                onInviteClick={
                  teamData?.members?.some((m: TeamMemberData) => m.userId === user?._id && m.role === "Owner")
                    ? () => setTab("team")
                    : undefined
                }
              />

              <TabBar
                tab={tab}
                onChange={setTab}
                visibleTabs={visibleTabs}
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  {tab === "overview" && (
                    <OverviewTab
                      draft={draft}
                      workspace={workspace}
                      tasks={tasks}
                      teamData={teamData}
                      onViewFullSuggestion={() => setAiOpen(true)}
                    />
                  )}
                  {tab === "tasks" && !isViewer && (
                    <TasksTab
                      draftId={draft?._id}
                      tasks={tasks}
                      refreshTasks={refreshTasks}
                      loading={loadingTasks}
                    />
                  )}
                  {tab === "team" && !isViewer && (
                    <TeamTab
                      draftId={draft?._id}
                      teamData={teamData}
                      refreshTeam={refreshTeam}
                      loading={loadingTeam}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.main>
          </SidebarInset>
        </div>

        {/* Stage change dialog */}
        <Dialog open={!!pendingStage} onOpenChange={(o) => !o && setPendingStage(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update stage</DialogTitle>
              <DialogDescription>
                Move <span className="font-medium text-foreground">{projectName}</span> to{" "}
                <span className="font-medium text-foreground">{pendingStage}</span>. Contributors
                will be notified.
              </DialogDescription>
            </DialogHeader>
            <Textarea placeholder="Add an optional note about this stage change…" rows={3} />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPendingStage(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const rawId = draft?._id || (draft as any)?.id || workspace?.draftId;
                  const targetDraftId =
                    typeof rawId === "string"
                      ? rawId
                      : rawId?._id?.toString() || rawId?.id?.toString() || "";

                  if (pendingStage && targetDraftId) {
                    updateDraftStage(targetDraftId, pendingStage)
                      .then(() => {
                        setStage(pendingStage);
                        queryClient.invalidateQueries({ queryKey: ["my-drafts"] });
                        queryClient.invalidateQueries({ queryKey: ["feed"] });
                        toast.success(`Stage updated to ${pendingStage}!`);
                        refreshTeam();
                      })
                      .catch((err: any) => {
                        toast.error(err.message ?? "Failed to update stage");
                      })
                      .finally(() => {
                        setPendingStage(null);
                      });
                  } else {
                    toast.error("Draft ID is required to update stage");
                  }
                }}
              >
                Update stage
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Floating AI */}
        <FloatingAI
          open={aiOpen}
          onOpenChange={setAiOpen}
          projectName={projectName}
          aiContext={aiContext}
        />
      </SidebarProvider>
    </ProtectedRoute>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top Bar with project name
// ─────────────────────────────────────────────────────────────────────────────

function WorkspaceTopBar({ projectName }: { projectName: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = getInitials(user?.name, user?.email);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/workspace" search={{ draftId: undefined }} className="hover:text-foreground transition-colors">
            Workspace
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium text-foreground">{projectName}</span>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
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
            <DropdownMenuLabel className="truncate">{user?.name || user?.email || "Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <UserCircle className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                toast("Signed out");
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Header
// ─────────────────────────────────────────────────────────────────────────────

function ProjectHeader({
  stage,
  onStageClick,
  available,
  onAvailableChange,
  projectName,
  description,
  members,
  onInviteClick,
  ownerName,
  userRole,
  raisedHandsCount = 0,
}: {
  stage: Stage;
  onStageClick: (s: Stage) => void;
  available: boolean;
  onAvailableChange: (v: boolean) => void;
  projectName: string;
  description: string;
  members: TeamMemberData[];
  onInviteClick?: () => void;
  ownerName?: string;
  userRole?: string;
  raisedHandsCount?: number;
}) {
  const initials = projectName.slice(0, 2).toUpperCase();

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      {/* row 1: identity + actions */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/15 font-display text-base font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[24px] font-semibold leading-tight tracking-tight">
                {projectName}
              </h1>
              <button className="text-muted-foreground transition-colors duration-[180ms] hover:text-foreground">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-primary" />
                {stage}
              </Badge>
              <Badge variant="outline" className="gap-1 rounded-full text-[10px]">
                <Globe2 className="h-3 w-3" /> Public
              </Badge>
              <Badge variant="outline" className="gap-1 rounded-full text-[10px]">
                <Github className="h-3 w-3" /> Connected
              </Badge>
              {/* Role badge — only shown for non-owners and when role is available */}
              {userRole && userRole !== "Owner" && (
                <Badge
                  variant="outline"
                  className={`gap-1 rounded-full text-[10px] ${userRole === "Contributor"
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                      : "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    }`}
                >
                  {userRole === "Contributor" ? (
                    <Edit3 className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  {userRole}
                </Badge>
              )}
              {userRole && userRole !== "Owner" && ownerName && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>by <span className="font-medium text-foreground">{ownerName}</span></span>
                </span>
              )}
            </div>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {description || "AI-powered project for building."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              const url = `${window.location.origin}/workspace${window.location.search}`;
              navigator.clipboard.writeText(url).then(() => {
                toast.success("Project link copied to clipboard!");
              }).catch(() => toast.error("Failed to copy link"));
            }}
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  const url = `${window.location.origin}/workspace${window.location.search}`;
                  navigator.clipboard.writeText(url).then(() => {
                    toast.success("Project link copied!");
                  }).catch(() => toast.error("Failed to copy link"));
                }}
              >
                <Link2 className="mr-2 h-4 w-4" /> Copy project link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const data = {
                    projectName,
                    description,
                    stage,
                    exportedAt: new Date().toISOString(),
                    url: window.location.href,
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-workspace.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(link.href);
                  toast.success("Project exported!");
                }}
              >
                <UploadCloud className="mr-2 h-4 w-4" /> Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  toast("Project archived (feature coming soon)");
                }}
              >
                Archive project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator className="my-6" />

      {/* row 2: actual revival requests count + stage tracker */}
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] items-center">
        <RevivalRequestsCard count={raisedHandsCount} />
        <StageTracker current={stage} onSelect={onStageClick} />
      </div>
    </section>
  );
}

function RevivalRequestsCard({ count }: { count: number }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 min-w-[190px]">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span>Revival Requests</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          <Zap className="h-3 w-3" /> Live
        </span>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-display text-3xl font-bold leading-none tracking-tight">{count}</span>
        <span className="pb-0.5 text-xs text-muted-foreground">raised hand{count !== 1 ? "s" : ""}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs border-t border-border/40 pt-2">
        <span className="text-muted-foreground">Revival Interest</span>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">{count > 0 ? `${count} Request${count > 1 ? "s" : ""}` : "No Requests Yet"}</span>
      </div>
    </div>
  );
}

function StageTracker({ current, onSelect }: { current: Stage; onSelect: (s: Stage) => void }) {
  const currentIndex = STAGES.indexOf(current);
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span>Stage Tracker</span>
        <span className="tracking-normal text-muted-foreground/80 normal-case">Click to update</span>
      </div>
      <div className="mt-3 flex items-center">
        {STAGES.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={s} className="flex flex-1 items-center">
              <button
                onClick={() => onSelect(s)}
                className="group flex flex-col items-center gap-1.5 focus:outline-none"
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full border transition-all duration-[220ms] ${active
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]"
                      : done
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground group-hover:border-primary/50 group-hover:text-foreground"
                    }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-[10px] font-semibold">{i + 1}</span>
                  )}
                </span>
                <span
                  className={`text-[11px] font-medium transition-colors duration-[180ms] ${active ? "text-foreground" : "text-muted-foreground"
                    }`}
                >
                  {s}
                </span>
              </button>
              {i < STAGES.length - 1 && (
                <span
                  className={`mx-2 h-px flex-1 transition-colors duration-[220ms] ${i < currentIndex ? "bg-primary/40" : "bg-border"
                    }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab Bar
// ─────────────────────────────────────────────────────────────────────────────
function TabBar({
  tab,
  onChange,
  visibleTabs,
}: {
  tab: "overview" | "tasks" | "team";
  onChange: (tab: "overview" | "tasks" | "team") => void;
  visibleTabs: Array<"overview" | "tasks" | "team">;
}) {
  const items: { id: "overview" | "tasks" | "team"; label: string; icon: typeof LayoutList }[] = [
    { id: "overview" as const, label: "Overview", icon: LineChart },

    ...(visibleTabs.includes("tasks")
      ? [{ id: "tasks" as const, label: "Tasks", icon: LayoutList }]
      : []),

    ...(visibleTabs.includes("team")
      ? [{ id: "team" as const, label: "Team", icon: Users }]
      : []),
  ];
  return (
    <div className="flex items-center gap-1 border-b border-border/60">
      {items.map((it) => {
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`group relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors duration-[180ms] ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <it.icon className="h-3.5 w-3.5" />
            {it.label}
            <span
              className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary transition-all duration-[220ms] ${active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-50"
                }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card primitive
// ─────────────────────────────────────────────────────────────────────────────

function Card({
  title,
  action,
  className = "",
  children,
}: {
  title?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-[220ms] hover:shadow-md ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && (
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW TAB
// ─────────────────────────────────────────────────────────────────────────────

function generateFallbackAnalysis(draft: Draft): AiIdeaAnalysis {
  const score = draft._id ? (parseInt(draft._id.slice(-4), 16) % 25) + 70 : 85;
  const verdicts: Array<"Worth Building" | "Needs Refinement" | "Reconsider"> = ["Worth Building", "Needs Refinement"];
  const verdict = verdicts[draft.projectName.length % verdicts.length];

  return {
    score,
    verdict,
    summary: `The project "${draft.projectName}" aims to address issues in the ${draft.domain} domain using ${draft.techStack?.slice(0, 3).join(", ") || "modern tech"}. It stalled due to ${draft.failureReason || "resource constraints"}.`,
    feasibility: {
      label: draft.techStack?.length > 4 ? "High" : "Medium",
      note: `Feasible utilizing ${draft.techStack?.[0] || "existing web frameworks"}.`,
    },
    competition: {
      label: "Medium",
      note: "Standard competitive landscape in this domain.",
    },
    complexity: {
      label: draft.techStack?.length > 5 ? "High" : "Medium",
      note: `Requires integration of ${draft.techStack?.slice(0, 2).join(" and ") || "frontend and backend components"}.`,
    },
    scalability: {
      label: "Medium",
      note: "Scale can be improved by containerizing services.",
    },
    market: {
      headline: "Niche market opportunity",
      note: `Targeted solution for ${draft.domain} related use cases.`,
    },
    recommendations: [
      `Refactor the codebase to clean up the ${draft.techStack?.[0] || "frontend"} architecture.`,
      `Create a minimal prototype focusing only on solving the core ${draft.failureReason || "blockers"}.`,
      `Establish a clearer roadmap to prevent further scope creep.`,
    ],
    techStack: {
      frontend: draft.techStack?.[0] || "React",
      backend: draft.techStack?.[1] || "Node.js",
      database: draft.techStack?.[2] || "MongoDB",
      ai: "Gemini API",
      hosting: "Vercel / AWS",
    },
    roadmap: [
      { week: "Week 1", label: "Analyze legacy code & plan MVP" },
      { week: "Week 2", label: `Implement core ${draft.techStack?.[0] || "features"}` },
      { week: "Week 3", label: "Resolve previous stall blockers" },
      { week: "Week 4", label: "Deployment & Initial Feedback" },
    ],
    finalNote: "A highly promising draft with a solid foundation. Addressing the core blocker will unlock immediate value.",
  };
}

// Cache workspace AI analysis per draft ID. Without this, OverviewTab's
// effect re-ran fetchAiIdeaAnalysis every time the /workspace route loader
// revalidated (route focus, navigation, etc.) — which hands back a *new*
// `draft` object each time even for the same draft, so the effect kept
// firing on an object-identity dependency. That silently burned through
// the shared Gemini free-tier quota (20 requests/min) in the background
// just from having a workspace tab open, which is what was starving the
// Idea Review page's own AI analysis calls (see the idea-review.tsx fix).
const aiAnalysisCache = new Map<string, AiIdeaAnalysis>();

function OverviewTab({
  draft,
  workspace,
  tasks,
  teamData,
  onViewFullSuggestion,
}: {
  draft: Draft | null;
  workspace: WorkspaceData;
  tasks: TaskData[];
  teamData: TeamResponseData | null;
  onViewFullSuggestion: () => void;
}) {
  const [aiAnalysis, setAiAnalysis] = useState<AiIdeaAnalysis | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  useEffect(() => {
    const draftId = draft?._id || draft?.id;
    if (!draft || !draftId) return;

    const cached = aiAnalysisCache.get(draftId);
    if (cached) {
      setAiAnalysis(cached);
      return;
    }

    setLoadingAi(true);
    fetchAiIdeaAnalysis({
      projectName: draft.projectName,
      pitch: draft.oneLiner,
      context: `Tech Stack: ${draft.techStack?.join(", ") || "None"}. Failure Reason: ${draft.failureReason || "None"}.`,
    })
      .then((data) => {
        aiAnalysisCache.set(draftId, data);
        setAiAnalysis(data);
      })
      .catch((err) => {
        console.error("Failed to fetch AI analysis:", err);
        setAiAnalysis(generateFallbackAnalysis(draft));
      })
      .finally(() => {
        setLoadingAi(false);
      });
    // Depend on the draft's id, not the draft object itself — the object
    // reference changes on every loader revalidation even for the same
    // draft, which used to refire this effect (and the Gemini call) every
    // time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?._id, draft?.id]);

  const activeAnalysis = aiAnalysis || (draft ? generateFallbackAnalysis(draft) : null);

  const stallReasonDescriptions: Record<string, string> = {
    "scope creep": "The project grew beyond its initial scope, leading to delayed progress and lost focus.",
    "lack of budget": "Insufficient funding to sustain development, server hosting, or API costs.",
    "no market need": "The core product value proposition didn't align with actual user demand or market fit.",
    "team split": "Key contributors left or the team lost alignment on product direction.",
    "technical debt": "Accumulated codebase complexity made adding new features too slow and error-prone.",
    "lack of time": "The contributors had other commitments and could not dedicate enough time to execute.",
    "marketing failure": "The team was unable to reach or acquire early users to validate the product.",
    "poor execution": "Technical challenges or design issues prevented shipping a functional product."
  };

  const failureReasonRaw = draft?.failureReason || "Scope Creep";
  const failureReasonKey = failureReasonRaw.toLowerCase();
  const failureDescription = stallReasonDescriptions[failureReasonKey] || `The project stalled due to ${failureReasonRaw}.`;

  const confidenceScore = activeAnalysis?.score || 91;

  // Real Snapshot metrics
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "Done").length;
  const realContributors = teamData?.members?.length || (draft?.collaborators?.length ? draft.collaborators.length + 1 : 1);
  const realRevivalRequests = draft?.raisedHands?.length || 0;
  const realUpvotes = draft?.upvotes || 0;
  const realViews = draft?.views || 0;

  // Unified activity generator
  const activities: Array<{
    icon: any;
    tone: string;
    what: string;
    when: string;
    rawDate: number;
  }> = [];

  // Add stage activity
  if (draft) {
    activities.push({
      icon: CheckCircle2,
      tone: "text-[color:var(--revive)]",
      what: `Stage updated to ${draft.currentStage}`,
      when: "recently",
      rawDate: draft.updatedAt ? new Date(draft.updatedAt).getTime() : Date.now(),
    });
  }

  // Add task updates
  tasks.forEach((task) => {
    activities.push({
      icon: task.status === "Done" ? CheckCircle2 : Circle,
      tone: task.status === "Done" ? "text-[color:var(--revive)]" : "text-muted-foreground",
      what: `Task "${task.title}" is ${task.status.toLowerCase()}`,
      when: task.updatedAt ? formatTimeAgo(task.updatedAt) : "recently",
      rawDate: task.updatedAt ? new Date(task.updatedAt).getTime() : 0,
    });
  });

  // Add team activity logs
  (teamData?.activity || []).forEach((act) => {
    activities.push({
      icon: act.what.includes("stage") ? CheckCircle2 : UserPlus,
      tone: "text-primary",
      what: `${act.who} ${act.what}`,
      when: act.when,
      rawDate: 0,
    });
  });

  // Sort: newest rawDate items first
  activities.sort((a, b) => b.rawDate - a.rawDate);

  // Fallbacks if empty
  if (activities.length === 0) {
    activities.push(
      {
        icon: GitPullRequest,
        tone: "text-primary",
        what: `Code repository initialized with ${draft?.techStack?.[0] || "React"}`,
        when: "3d ago",
        rawDate: 0,
      },
      {
        icon: UserPlus,
        tone: "text-primary",
        what: "Project draft created and shared",
        when: "4d ago",
        rawDate: 0,
      }
    );
  }

  // Tags
  const tags = draft?.techStack || ["React", "Node.js", "MongoDB"];

  // Blocker / Completed tasks notes layout
  const completedTasks = tasks.filter((t) => t.status === "Done");
  let noteContent: ReactNode;
  if (completedTasks.length > 0) {
    noteContent = (
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
          Recently Completed Tasks
        </p>
        <ul className="space-y-1.5">
          {completedTasks.slice(0, 3).map((t: TaskData) => (
            <li key={t._id} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[color:var(--revive)] shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold text-foreground">{t.title}</span>
                {t.description && (
                  <span className="text-muted-foreground text-xs block truncate max-w-lg">
                    {t.description}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  } else {
    noteContent = (
      <p className="text-sm leading-relaxed text-muted-foreground">
        {workspace?.currentBlockers || "No blockers reported yet. Click on Tasks to add things to do."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Why It Stalled · What's Next */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Why It Stalled">
          <div className="flex items-start gap-2">
            <Badge className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive/15">
              {failureReasonRaw}
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {failureDescription}
          </p>
          <div className="mt-5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span>Confidence</span>
              <span className="text-foreground">{confidenceScore}%</span>
            </div>
            <Progress value={confidenceScore} className="mt-2 h-1.5" />
          </div>
        </Card>

        <Card title="What's Next (AI)">
          {loadingAi ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-10 bg-muted rounded-full w-full mt-5" />
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-tint-lilac">
                  <Lightbulb className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold leading-tight">
                    {activeAnalysis?.recommendations?.[0] || "Analyze Next Steps"}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {activeAnalysis?.recommendations?.[1] || "Evaluate draft roadmap and check for key blockers."}
                  </p>
                </div>
              </div>
              <Button
                className="mt-5 h-9 w-full rounded-full"
                onClick={onViewFullSuggestion}
              >
                View Full Suggestion <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          )}
        </Card>
      </div>

      {/* Row 2: Project Snapshot · Top Activity */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Card title="Project Snapshot">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: "Tasks", value: `${totalTasks}`, sub: `${doneTasks} done` },
              { label: "Contributors", value: `${realContributors}`, sub: realContributors > 1 ? "team members" : "owner" },
              { label: "Revivals", value: `${realRevivalRequests}`, sub: realRevivalRequests > 0 ? "active requests" : "0 requests" },
              { label: "Upvotes", value: `${realUpvotes}`, sub: `${realViews} views` },
            ].map((m) => (
              <div key={m.label} className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight truncate">
                  {m.label}
                </div>
                <div className="mt-1 font-display text-xl font-semibold leading-none">
                  {m.value}
                </div>
                {m.sub && <div className="mt-1 text-[11px] text-muted-foreground truncate">{m.sub}</div>}
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Updated recently
          </div>
        </Card>

        <Card
          title="Top Activity (Last 7 Days)"
          action={
            <button className="text-muted-foreground transition-colors duration-[180ms] hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </button>
          }
        >
          <ul className="divide-y divide-border/60">
            {activities.slice(0, 3).map((a, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <a.icon className={`h-3.5 w-3.5 shrink-0 ${a.tone}`} />
                <span className="flex-1 truncate text-sm">{a.what}</span>
                <span className="text-xs text-muted-foreground">{a.when}</span>
              </li>
            ))}
          </ul>

          <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
            <button
              onClick={() => setActivityOpen(true)}
              className="mt-3 text-xs font-medium text-primary transition-colors duration-[180ms] hover:text-primary/80"
            >
              View all activity
            </button>
            <DialogContent className="sm:max-w-md bg-card text-foreground border border-border">
              <DialogHeader>
                <DialogTitle>All Project Activity</DialogTitle>
                <DialogDescription>
                  Recent updates, task status changes, and collaborator actions for this workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-80 overflow-y-auto space-y-4 pr-1 mt-2">
                {activities.length > 0 ? (
                  <ul className="divide-y divide-border/60">
                    {activities.map((a, i) => (
                      <li key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 border-b border-border/60 last:border-0">
                        <a.icon className={`h-4 w-4 shrink-0 mt-0.5 ${a.tone}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground leading-snug">{a.what}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.when}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No activity recorded yet.
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>

      {/* Row 3: Recent Notes · Tags */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <Card title="Recent Notes">
          {noteContent}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>─ System note</span>
            <span className="text-muted-foreground/50">·</span>
            <span>Recently updated</span>
          </div>
        </Card>

        <Card title="Tags">
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="rounded-full border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {t}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + "y ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + "mo ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + "d ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "h ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + "m ago";
  return seconds < 10 ? "just now" : Math.floor(seconds) + "s ago";
}

function DraftCompassMini({ analysis }: { analysis: AiIdeaAnalysis }) {
  const getScore = (label: "High" | "Medium" | "Low") => {
    if (label === "High") return 85;
    if (label === "Medium") return 65;
    return 45;
  };

  const axes = [
    { label: "Feasibility", value: getScore(analysis.feasibility.label) },
    { label: "Competition", value: getScore(analysis.competition.label) },
    { label: "Complexity", value: getScore(analysis.complexity.label) },
    { label: "Scalability", value: getScore(analysis.scalability.label) },
  ];
  const cx = 70;
  const cy = 70;
  const rMax = 56;
  const N = axes.length;
  const angle = (i: number) => (i / N) * Math.PI * 2 - Math.PI / 2;
  const pt = (i: number, v: number) => {
    const r = (v / 100) * rMax;
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))] as const;
  };
  const poly = axes.map((a, i) => pt(i, a.value).join(",")).join(" ");
  const rings = [0.33, 0.66, 1];

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-32 w-32 shrink-0">
        {rings.map((k) => (
          <circle
            key={k}
            cx={cx}
            cy={cy}
            r={rMax * k}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.6}
          />
        ))}
        {axes.map((_, i) => {
          const [x, y] = pt(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="var(--border)"
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}
        <polygon
          points={poly}
          fill="var(--primary)"
          fillOpacity={0.18}
          stroke="var(--primary)"
          strokeWidth={1.5}
        />
        {axes.map((a, i) => {
          const [x, y] = pt(i, a.value);
          return <circle key={a.label} cx={x} cy={y} r={2.5} fill="var(--primary)" />;
        })}
      </svg>

      <ul className="flex-1 space-y-2 text-sm">
        {axes.map((a) => (
          <li key={a.label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{a.label}</span>
            <span className="font-medium text-foreground">{a.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DraftCard({
  draft,
  onClick,
  rolePillClass,
}: {
  draft: any;
  onClick: () => void;
  rolePillClass?: (role: string) => string;
}) {
  const progress = stageToProgress(draft.currentStage);
  const updatedAt = new Date(draft.updatedAt || draft.createdAt).toLocaleDateString();
  const role = draft.userRole || (draft.isOwner ? "Owner" : "Owner");

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl p-4 sm:p-5 hover:border-primary/30 hover:bg-card/70 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-primary">
          {draft.projectName.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {draft.projectName}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rolePillClass
                      ? rolePillClass(role)
                      : "bg-primary/15 text-primary border-primary/30"
                    }`}
                >
                  <Crown className="h-2.5 w-2.5" />
                  {role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{draft.oneLiner}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </div>


          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Badge variant="secondary" className="text-[10px] rounded-md">{draft.currentStage}</Badge>
            <div className="flex gap-1.5">
              {draft.techStack.slice(0, 2).map((tech: string, i: number) => (
                <Badge key={i} variant="outline" className="text-[10px] rounded-md">
                  {(tech.split("/").pop() ?? tech).slice(0, 8)}
                </Badge>
              ))}
              {draft.techStack.length > 2 && (
                <Badge variant="outline" className="text-[10px] rounded-md">+{draft.techStack.length - 2}</Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
              <Calendar className="h-3 w-3" /> {updatedAt}
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-purple-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function SharedDraftCard({
  draft,
  onClick,
  onLeave,
  rolePillClass,
}: {
  draft: any;
  onClick: () => void;
  onLeave: () => void;
  rolePillClass: (role: string) => string;
}) {
  const progress = stageToProgress(draft.currentStage);
  const updatedAt = new Date(draft.updatedAt || draft.createdAt).toLocaleDateString();
  const role: string = draft._sharedRole || "Contributor";
  const ownerName: string = draft._ownerName || (typeof draft.submittedBy === "object" ? draft.submittedBy?.name || "Unknown" : "Unknown");

  return (
    <div className="relative w-full group">
      {/* Shared indicator left border */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${role === "Contributor" ? "bg-violet-500/70" : "bg-sky-500/70"
          }`}
      />
      <button
        onClick={onClick}
        className="w-full text-left rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl p-4 sm:p-5 pl-5 hover:border-primary/30 hover:bg-card/70 transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-violet-500/20 to-sky-500/20 flex items-center justify-center text-sm font-bold text-violet-600 dark:text-violet-400">
            {draft.projectName.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {draft.projectName}
                  </h3>
                  {/* Role pill */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rolePillClass(role)}`}
                  >
                    {role === "Contributor" ? (
                      <Edit3 className="h-2.5 w-2.5" />
                    ) : (
                      <Lock className="h-2.5 w-2.5" />
                    )}
                    {role}
                  </span>
                  {/* Shared indicator */}
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>by <span className="font-medium text-foreground">{ownerName}</span></span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{draft.oneLiner}</p>
              </div>
              {/* Overflow menu */}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-7 w-7 flex items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={onClick}>
                      Open workspace
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-rose-500 focus:text-rose-500"
                      onClick={onLeave}
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      Leave workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Badge variant="secondary" className="text-[10px] rounded-md">{draft.currentStage}</Badge>
              <Badge variant="outline" className="text-[10px] rounded-md capitalize">{draft.domain}</Badge>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                <Calendar className="h-3 w-3" /> {updatedAt}
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className={`h-full ${role === "Contributor" ? "bg-gradient-to-r from-violet-500 to-primary" : "bg-gradient-to-r from-sky-400 to-sky-600"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 relative">
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/20 blur-[100px]" />
      </div>

      <div className="rounded-3xl border border-border/40 bg-card/45 backdrop-blur-xl p-8 sm:p-12 text-center max-w-md">
        <Zap className="h-12 w-12 text-primary/60 mx-auto mb-4" />
        <h2 className="font-display text-2xl font-semibold">You don't have any drafts yet.</h2>
        <p className="mt-2 text-sm text-muted-foreground">Create your first draft to start building.</p>
        <Button asChild className="mt-6 rounded-xl gap-2">
          <Link to="/new-draft"><Plus className="h-4 w-4" /> Create New Draft</Link>
        </Button>
      </div>
    </div>
  );
}



// ─────────────────────────────────────────────────────────────────────────────
// TASKS TAB
// ─────────────────────────────────────────────────────────────────────────────

function TasksTab({
  draftId,
  tasks,
  refreshTasks,
  loading,
}: {
  draftId: string | undefined;
  tasks: TaskData[];
  refreshTasks: () => void;
  loading: boolean;
}) {
  const [view, setView] = useState<"list" | "board">("list");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0]._id!);
    }
  }, [tasks, selectedTaskId]);

  const [createOpen, setCreateOpen] = useState(false);

  // Create task form states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [newAssignee, setNewAssignee] = useState("");
  const [newLabels, setNewLabels] = useState("");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newLinkedPR, setNewLinkedPR] = useState("");
  const [newDependencies, setNewDependencies] = useState("");

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftId || !newTitle.trim()) return;

    const checklistItems = newChecklistText
      .split("\n")
      .map(item => item.trim())
      .filter(Boolean)
      .map(text => ({ text, completed: false }));

    createTask({
      draftId,
      title: newTitle,
      description: newDesc,
      status: "Todo",
      priority: newPriority,
      assignee: newAssignee,
      labels: newLabels.split(",").map((l: string) => l.trim()).filter(Boolean),
      checklist: checklistItems,
      dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
      linkedPR: newLinkedPR,
      dependencies: newDependencies
    })
      .then((created: TaskData) => {
        toast.success("Task created successfully!");
        setCreateOpen(false);
        setNewTitle("");
        setNewDesc("");
        setNewPriority("Medium");
        setNewAssignee("");
        setNewLabels("");
        setNewChecklistText("");
        setNewDueDate("");
        setNewLinkedPR("");
        setNewDependencies("");
        refreshTasks();
      })
      .catch((err: any) => {
        toast.error(err.message ?? "Failed to create task");
      });
  };

  const handleUpdateStatus = (taskId: string, status: "Todo" | "In Progress" | "Done") => {
    updateTask(taskId, { status })
      .then(() => {
        refreshTasks();
      })
      .catch((err: any) => {
        toast.error(err.message ?? "Failed to update status");
      });
  };

  const selectedTask = tasks.find(t => t._id === selectedTaskId) || tasks[0];

  if (loading && tasks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      {/* LEFT — task list */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm flex flex-col justify-between min-h-[500px]">
        <div>
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Tasks
            </h2>
            <div className="flex items-center gap-1 rounded-full border border-border bg-background p-0.5 text-[11px]">
              {(["list", "board"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-full px-2.5 py-1 font-medium capitalize transition-colors duration-[180ms] ${view === v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-5">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No tasks created yet. Click below to add one.
              </div>
            ) : (
              (["In Progress", "Todo", "Done"] as const).map((section) => {
                const items = tasks.filter((t) => t.status === section);
                if (items.length === 0 && view === "board") return null;
                return (
                  <div key={section}>
                    <div className="flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <span>{section}</span>
                      <span>{items.length}</span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {items.map((t) => {
                        const active = t._id === selectedTaskId;
                        return (
                          <li key={t._id}>
                            <button
                              onClick={() => setSelectedTaskId(t._id!)}
                              className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-[180ms] ${active ? "bg-primary/8 ring-1 ring-primary/30" : "hover:bg-muted/60"
                                }`}
                            >
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextStatus = t.status === "Done" ? "Todo" : "Done";
                                  handleUpdateStatus(t._id!, nextStatus);
                                }}
                                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border cursor-pointer hover:border-primary/50 transition-colors ${t.status === "Done"
                                    ? "border-[color:var(--revive)] bg-[color:var(--revive)] text-white"
                                    : t.status === "In Progress"
                                      ? "border-primary text-primary"
                                      : "border-border"
                                  }`}
                              >
                                {t.status === "Done" ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : t.status === "In Progress" ? (
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                ) : (
                                  <Circle className="h-2.5 w-2.5 opacity-0" />
                                )}
                              </span>
                              <span
                                className={`flex-1 truncate text-sm ${t.status === "Done" ? "text-muted-foreground line-through" : ""
                                  }`}
                              >
                                {t.title}
                              </span>
                              <PriorityChip p={t.priority} />
                              <Avatar className="h-5 w-5 ring-1 ring-card">
                                <AvatarFallback className="bg-primary/15 text-[8px] font-semibold text-primary uppercase">
                                  {t.assignee ? t.assignee.slice(0, 2) : "UN"}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <Button onClick={() => setCreateOpen(true)} variant="outline" size="sm" className="mt-4 w-full rounded-full">
            <Plus className="mr-1 h-3.5 w-3.5" /> New task
          </Button>
          <DialogContent className="sm:max-w-lg bg-card text-foreground border border-border">
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
              <DialogDescription>
                Add a new task to organize your workspace workflow.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Title *</label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title..." required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What needs to be done?" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Assignee</label>
                  <Input value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} placeholder="e.g. Ansh V." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Due Date</label>
                  <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Labels (comma separated)</label>
                  <Input value={newLabels} onChange={(e) => setNewLabels(e.target.value)} placeholder="e.g. Backend, Auth" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Dependencies</label>
                  <Input value={newDependencies} onChange={(e) => setNewDependencies(e.target.value)} placeholder="e.g. Database Schema" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Linked PR</label>
                  <Input value={newLinkedPR} onChange={(e) => setNewLinkedPR(e.target.value)} placeholder="e.g. #45 Implement login" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Checklist Items (one per line)</label>
                <Textarea value={newChecklistText} onChange={(e) => setNewChecklistText(e.target.value)} placeholder="Setup login endpoint&#10;Validate inputs" rows={2} />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* RIGHT — task detail */}
      {selectedTask ? (
        <TaskDetail task={selectedTask} onUpdate={refreshTasks} />
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex items-center justify-center text-muted-foreground text-sm">
          Select a task from the list to view its details.
        </div>
      )}
    </div>
  );
}

function PriorityChip({ p }: { p: Priority }) {
  const cls =
    p === "High"
      ? "bg-destructive/10 text-destructive"
      : p === "Medium"
        ? "bg-tint-peach text-foreground"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${cls}`}
    >
      {p}
    </span>
  );
}

function TaskDetail({ task, onUpdate }: { task: TaskData; onUpdate: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editStatus, setEditStatus] = useState(task.status);
  const [editAssignee, setEditAssignee] = useState(task.assignee);
  const [editLabels, setEditLabels] = useState(task.labels.join(", "));
  const [editDueDate, setEditDueDate] = useState(task.dueDate ? task.dueDate.split("T")[0] : "");
  const [editLinkedPR, setEditLinkedPR] = useState(task.linkedPR);
  const [editDependencies, setEditDependencies] = useState(task.dependencies);

  useEffect(() => {
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditAssignee(task.assignee);
    setEditLabels(task.labels.join(", "));
    setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setEditLinkedPR(task.linkedPR);
    setEditDependencies(task.dependencies);
  }, [task]);

  const handleEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task._id) return;

    updateTask(task._id, {
      title: editTitle,
      description: editDesc,
      priority: editPriority,
      status: editStatus,
      assignee: editAssignee,
      labels: editLabels.split(",").map((l: string) => l.trim()).filter(Boolean),
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      linkedPR: editLinkedPR,
      dependencies: editDependencies
    })
      .then(() => {
        toast.success("Task updated successfully!");
        setEditOpen(false);
        onUpdate();
      })
      .catch((err: any) => {
        toast.error(err.message ?? "Failed to update task");
      });
  };

  const handleDeleteTask = () => {
    if (!task._id) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    deleteTask(task._id)
      .then(() => {
        toast.success("Task deleted successfully!");
        onUpdate();
      })
      .catch((err: any) => {
        toast.error(err.message ?? "Failed to delete task");
      });
  };

  const handleToggleChecklist = (itemIndex: number) => {
    if (!task._id) return;
    const updatedChecklist = task.checklist.map((item: TaskChecklistItem, idx: number) =>
      idx === itemIndex ? { ...item, completed: !item.completed } : item
    );

    updateTaskChecklist(task._id, updatedChecklist)
      .then(() => {
        onUpdate();
      })
      .catch((err: any) => {
        toast.error(err.message ?? "Failed to update checklist");
      });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task._id || !commentText.trim()) return;

    addTaskComment(task._id, commentText)
      .then(() => {
        setCommentText("");
        onUpdate();
      })
      .catch((err: any) => {
        toast.error(err.message ?? "Failed to add comment");
      });
  };

  const doneCount = task.checklist ? task.checklist.filter((c: TaskChecklistItem) => c.completed).length : 0;
  const checklistLength = task.checklist ? task.checklist.length : 0;
  const progressPercent = checklistLength > 0 ? (doneCount / checklistLength) * 100 : 0;

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : "No due date";

  let aiSuggestionText = "Everything looks clear! Keep up the good work.";
  let hasOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== "Done" : false;
  let isUnassigned = !task.assignee;
  let isHighPriorityBlocker = task.priority === "High" && task.status !== "Done";

  if (hasOverdue) {
    aiSuggestionText = `This task is overdue (${formattedDueDate}). Prioritize finishing it or update the due date to avoid staging delay.`;
  } else if (isHighPriorityBlocker) {
    aiSuggestionText = "This is a High Priority blocker. Assign all necessary resources here first before moving to other items.";
  } else if (isUnassigned) {
    aiSuggestionText = "This task has no assignee. Assign a team member to ensure someone takes ownership of this implementation.";
  } else if (checklistLength > 0 && progressPercent < 50) {
    aiSuggestionText = `Only ${doneCount}/${checklistLength} checklist items completed. Break this down and address the first uncompleted item.`;
  } else if (task.status === "In Progress" && (!task.comments || task.comments.length === 0)) {
    aiSuggestionText = "No comments or updates posted yet. Add a quick status update comment to align the team.";
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[22px] font-semibold leading-tight tracking-tight">
              {task.title}
            </h2>
            <PriorityChip p={task.priority} />
            <Badge variant="secondary" className="rounded-full text-[10px]">
              {task.status}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Due: {formattedDueDate} {task.labels && task.labels.length > 0 && `· ${task.labels.join(", ")}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <Button onClick={() => setEditOpen(true)} variant="outline" size="sm" className="rounded-full">
              <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
            <DialogContent className="sm:max-w-lg bg-card text-foreground border border-border">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>
                  Modify the details of this task.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditTask} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Title *</label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Task title..." required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Description</label>
                  <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="What needs to be done?" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as any)}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:outline-none"
                    >
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Assignee</label>
                    <Input value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)} placeholder="e.g. Ansh V." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Due Date</label>
                    <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Dependencies</label>
                    <Input value={editDependencies} onChange={(e) => setEditDependencies(e.target.value)} placeholder="e.g. Database Schema" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Linked PR</label>
                    <Input value={editLinkedPR} onChange={(e) => setEditLinkedPR(e.target.value)} placeholder="e.g. #45 Implement login" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Labels (comma separated)</label>
                  <Input value={editLabels} onChange={(e) => setEditLabels(e.target.value)} placeholder="Backend, Auth" />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
              <DropdownMenuItem onClick={handleDeleteTask} className="text-destructive focus:text-destructive">
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator className="my-5" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-6">
          <section>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Description
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {task.description || "No description provided."}
            </p>
          </section>

          {checklistLength > 0 && (
            <section>
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Checklist
                </div>
                <span className="text-xs text-muted-foreground">
                  {doneCount}/{checklistLength}
                </span>
              </div>
              <Progress value={progressPercent} className="mt-2 h-1.5" />
              <ul className="mt-3 space-y-1.5">
                {task.checklist.map((c: TaskChecklistItem, idx: number) => (
                  <li key={idx}>
                    <button
                      onClick={() => handleToggleChecklist(idx)}
                      className="group flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors duration-[180ms] hover:bg-muted/60"
                    >
                      <span
                        className={`grid h-4 w-4 place-items-center rounded border transition-colors duration-[180ms] ${c.completed ? "border-primary bg-primary text-primary-foreground" : "border-border"
                          }`}
                      >
                        {c.completed && <CheckCircle2 className="h-3 w-3" />}
                      </span>
                      <span className={`text-sm ${c.completed ? "text-muted-foreground line-through" : ""}`}>
                        {c.text}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Comments
            </div>
            <div className="mt-3 space-y-3">
              {task.comments && task.comments.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {task.comments.map((c: TaskComment, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <Avatar className="h-7 w-7 ring-2 ring-card">
                        <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary uppercase">
                          {c.author.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-xl bg-muted/50 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{c.author}</span>
                          <span className="text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-foreground">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleAddComment} className="flex items-start gap-2.5">
                <Avatar className="h-7 w-7 ring-2 ring-card">
                  <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary uppercase">
                    ME
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Write a comment…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="rounded-xl"
                  />
                  <Button type="submit" size="sm" className="rounded-xl">Comment</Button>
                </div>
              </form>
            </div>
          </section>
        </div>

        {/* Right meta */}
        <aside className="space-y-4">
          <MetaRow label="Assignee">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary uppercase">
                  {task.assignee ? task.assignee.slice(0, 2) : "UN"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{task.assignee || "Unassigned"}</span>
            </div>
          </MetaRow>
          {task.labels && task.labels.length > 0 && (
            <MetaRow label="Labels">
              <div className="flex flex-wrap gap-1.5">
                {task.labels.map((l: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="rounded-full text-[10px]">
                    {l}
                  </Badge>
                ))}
              </div>
            </MetaRow>
          )}
          <MetaRow label="Due">
            <span className="text-sm">{formattedDueDate}</span>
          </MetaRow>
          {task.linkedPR && (
            <MetaRow label="Linked PR">
              <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                <GitPullRequest className="h-3.5 w-3.5" /> {task.linkedPR}
              </span>
            </MetaRow>
          )}
          {task.dependencies && (
            <MetaRow label="Dependencies">
              <span className="text-sm">{task.dependencies}</span>
            </MetaRow>
          )}

          <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3 w-3" /> AI Suggestion
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {aiSuggestionText}
            </p>
            <Button variant="ghost" size="sm" className="mt-2 h-7 rounded-full px-2 text-xs">
              Ask AI <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// STALL DNA TAB
// ─────────────────────────────────────────────────────────────────────────────

function StallDNATab() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Primary Stall Pattern" className="lg:col-span-1">
        <h3 className="font-display text-lg font-semibold tracking-tight">Scope Creep Syndrome</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Strong signals of expanding scope beyond core value, causing delayed progress and context
          switching.
        </p>
        <div className="mt-5 rounded-xl bg-muted/50 p-4">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span>Confidence</span>
            <span className="text-foreground">91%</span>
          </div>
          <Progress value={91} className="mt-2 h-1.5" />
        </div>
      </Card>

      <Card title="Similar Stalled Projects" className="lg:col-span-1">
        <ul className="space-y-3">
          {[
            { name: "CampusConnect", stack: "React, Node.js, MongoDB", match: 91 },
            { name: "QuizMaster", stack: "Flutter, Firebase", match: 87 },
            { name: "EventHub", stack: "Next.js, PostgreSQL", match: 85 },
          ].map((p) => (
            <li
              key={p.name}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-tint-lilac font-display text-[11px] font-bold">
                {p.name.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.stack}</p>
              </div>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                {p.match}% match
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Most Successful Recovery" className="lg:col-span-1">
        <h3 className="font-display text-base font-semibold tracking-tight">Lock the MVP scope</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Projects that defined a strict MVP and cut non-essential features had the highest success
          rate.
        </p>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold tracking-tight">78%</span>
          <span className="text-xs text-muted-foreground">success rate</span>
        </div>
        <Button variant="outline" size="sm" className="mt-4 w-full rounded-full">
          See Action Plan <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </Card>

      <Card title="Predicted Stall Factors" className="lg:col-span-2">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { label: "Scope Creep", level: "Very High" },
            { label: "Vague Requirements", level: "High" },
            { label: "Tech Overthinking", level: "Medium" },
            { label: "Lack of Consistency", level: "Medium" },
            { label: "Resource Constraints", level: "Low" },
          ].map((f) => (
            <li
              key={f.label}
              className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <span>{f.label}</span>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                {f.level}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Revival Probability">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-semibold tracking-tight">67%</span>
          <span className="text-xs text-muted-foreground">if action taken now</span>
        </div>
        <Progress value={67} className="mt-3 h-1.5" />
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Based on 4 similar projects that made it past this stage.
        </p>
      </Card>

      <Card title="Recovery Suggestions" className="lg:col-span-3">
        <ul className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: Flag,
              title: "Define MVP boundary",
              body: "List 3 features. Everything else is v2.",
            },
            {
              icon: Rocket,
              title: "Ship the login flow",
              body: "Unblock testing and get end-to-end feedback.",
            },
            {
              icon: Users,
              title: "Weekly async standup",
              body: "Short written updates to prevent context switching.",
            },
          ].map((s) => (
            <li
              key={s.title}
              className="rounded-xl border border-border bg-background p-4 transition-all duration-[220ms] hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-tint-mint">
                <s.icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-sm font-medium">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEAM TAB
// ─────────────────────────────────────────────────────────────────────────────

function TeamTab({
  draftId,
  teamData,
  refreshTeam,
  loading,
}: {
  draftId: string | undefined;
  teamData: TeamResponseData | null;
  refreshTeam: () => void;
  loading: boolean;
}) {
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Contributor" | "Viewer">("Contributor");

  const isCurrentUserOwner = teamData?.members?.some(
    (m: TeamMemberData) => m.userId === user?._id && m.role === "Owner"
  ) || false;

  const myMember = teamData?.members?.find((m: TeamMemberData) => m.userId === user?._id);
  const myRole = myMember?.role || "Viewer";

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftId || !inviteEmail.trim()) return;

    inviteTeamMember(draftId, inviteEmail, inviteRole)
      .then(() => {
        toast.success("Member invited successfully!");
        setInviteOpen(false);
        setInviteEmail("");
        refreshTeam();
      })
      .catch((err: any) => {
        toast.error(err.message ?? "Failed to invite member");
      });
  };

  const handleUpdateRole = (userId: string, role: string) => {
    if (!draftId) return;
    updateTeamMemberRole(draftId, userId, role)
      .then(() => {
        toast.success("Role updated successfully!");
        refreshTeam();
      })
      .catch((err: any) => {
        toast.error(err.message ?? "Failed to update role");
      });
  };

  const handleRemoveMember = (userId: string) => {
    if (!draftId) return;
    if (!confirm("Are you sure you want to remove this member?")) return;
    removeTeamMember(draftId, userId)
      .then(() => {
        toast.success("Member removed successfully!");
        refreshTeam();
      })
      .catch((err: any) => {
        toast.error(err.message ?? "Failed to remove member");
      });
  };

  const handleApproveRequest = (email: string) => {
    if (!draftId) return;
    approveJoinRequest(draftId, email)
      .then(() => {
        toast.success("Join request approved!");
        refreshTeam();
      })
      .catch((err: any) => {
        toast.error(err.message ?? "Failed to approve request");
      });
  };

  const handleDeclineRequest = (email: string) => {
    if (!draftId) return;
    declineJoinRequest(draftId, email)
      .then(() => {
        toast.success("Join request declined!");
        refreshTeam();
      })
      .catch((err: any) => {
        toast.error(err.message ?? "Failed to decline request");
      });
  };

  if (loading && !teamData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card
          title="Contributors"
          action={
            isCurrentUserOwner && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <Button onClick={() => setInviteOpen(true)} size="sm" className="h-8 rounded-full">
                  <UserPlus className="mr-1 h-3.5 w-3.5" /> Invite
                </Button>
                <DialogContent className="sm:max-w-md bg-card text-foreground border border-border">
                  <DialogHeader>
                    <DialogTitle>Invite Contributor</DialogTitle>
                    <DialogDescription>
                      Invite a member to collaborate on this workspace. The user must be registered on DraftYard.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="collaborator@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as any)}
                        className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:outline-none"
                      >
                        <option value="Contributor">Contributor</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )
          }
        >
          <ul className="divide-y divide-border/60">
            {teamData?.members?.map((member: TeamMemberData) => {
              const initials = member.name
                ? member.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
                : "UN";
              const isMemberSelf = member.userId === user?._id;
              return (
                <li key={member.userId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar className="h-9 w-9 ring-2 ring-card">
                    <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary">
                      {initials.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {member.name} {isMemberSelf && <span className="text-xs text-muted-foreground">(You)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full text-[10px]">
                    {member.role}
                  </Badge>
                  {isCurrentUserOwner && member.role !== "Owner" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(member.userId, "Contributor")}
                          disabled={member.role === "Contributor"}
                        >
                          Make Contributor
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(member.userId, "Viewer")}
                          disabled={member.role === "Viewer"}
                        >
                          Make Viewer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="border-border" />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          Remove from team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Pending Join Requests">
          {teamData?.joinRequests && teamData.joinRequests.length > 0 ? (
            <ul className="space-y-2">
              {teamData.joinRequests.map((req: JoinRequestData) => (
                <li key={req.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                      {req.name ? req.name.slice(0, 2).toUpperCase() : "RQ"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{req.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested {new Date(req.createdAt).toLocaleDateString()} · "{req.message || "Wants to join project"}"
                    </p>
                  </div>
                  {isCurrentUserOwner ? (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full"
                        onClick={() => handleDeclineRequest(req.email)}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 rounded-full"
                        onClick={() => handleApproveRequest(req.email)}
                      >
                        Approve
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Owner review pending</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No pending join requests.
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Roles">
          <ul className="space-y-2 text-sm">
            {[
              { role: "Owner", count: teamData?.members?.filter((m: TeamMemberData) => m.role === "Owner").length || 0 },
              { role: "Contributor", count: teamData?.members?.filter((m: TeamMemberData) => m.role === "Contributor").length || 0 },
              { role: "Viewer", count: teamData?.members?.filter((m: TeamMemberData) => m.role === "Viewer").length || 0 },
            ].map((r) => (
              <li key={r.role} className="flex items-center justify-between">
                <span>{r.role}</span>
                <span className="text-muted-foreground font-semibold">{r.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Permissions">
          <ul className="space-y-2 text-sm">
            {[
              { icon: Shield, text: "Owners manage project settings", role: "Owner" },
              { icon: UserPlus, text: "Owners invite / remove members", role: "Owner" },
              { icon: Edit3, text: "Contributors edit tasks and files", role: "Contributor" },
              { icon: Lock, text: "Viewers have read-only access", role: "Viewer" },
            ].map((p, i) => {
              const isActive = myRole === p.role;
              return (
                <li
                  key={i}
                  className={`flex items-start gap-2 rounded-lg p-1.5 transition-all duration-[180ms] ${isActive
                      ? "bg-primary/8 text-foreground ring-1 ring-primary/20"
                      : "text-muted-foreground opacity-70"
                    }`}
                >
                  <p.icon className={`mt-0.5 h-3.5 w-3.5 ${isActive ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                  <span>{p.text} {isActive && " (Active)"}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Recent Team Activity">
          {teamData?.activity && teamData.activity.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {teamData.activity.slice(0, 5).map((a: ActivityLogData) => (
                <li key={a.id} className="flex items-start gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/15 text-[9px] font-semibold text-primary">
                      {a.initials}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">{a.who}</span> {a.what}
                    <span className="ml-1 text-muted-foreground/70">· {a.when}</span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No recent activity logs.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating AI
// ─────────────────────────────────────────────────────────────────────────────

function FloatingAI({
  open,
  onOpenChange,
  projectName,
  aiContext,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectName: string;
  aiContext?: any;
}) {
  return (
    <>
      <motion.button
        onClick={() => onOpenChange(true)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition-all duration-[180ms] hover:-translate-y-0.5 hover:shadow-xl"
        aria-label="Open AI Assistant"
      >
        <Bot className="h-5 w-5" />
      </motion.button>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">AI Assistant</p>
                <p className="text-[11px] text-muted-foreground">Context: {projectName}</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors duration-[180ms] hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="flex items-start gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary">
                <Bot className="h-3.5 w-3.5" />
              </span>
              <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-3 py-2 text-sm leading-relaxed">
                Hi Dev — {projectName} is stalled on <span className="font-medium">Scope Creep</span>.
                Want me to draft a locked MVP scope?
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {["Draft MVP scope", "Summarize open tasks", "Suggest next PR"].map((s) => (
                <button
                  key={s}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition-colors duration-[180ms] hover:border-primary/60 hover:bg-primary/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border/60 p-3">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background pl-3 pr-1 py-1 focus-within:ring-2 focus-within:ring-primary/30">
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Ask about this project…"
              />
              <button className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-[180ms] hover:-translate-y-0.5">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}