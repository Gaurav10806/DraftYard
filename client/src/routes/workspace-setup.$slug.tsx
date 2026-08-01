import { useState, useRef, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  FileText,
  ListChecks,
  Users,
} from "lucide-react";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { drafts } from "@/data/drafts";
import { fetchFeed, createWorkspace, fetchWorkspace, updateWorkspace } from "@/lib/api";
import { slugify } from "@/routes/project.$slug";
import { type WorkspaceTask, type WorkspaceMilestone } from "@/lib/workspace-store";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/workspace-setup/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: typeof search.edit === "string" ? search.edit === "true" : Boolean(search.edit),
  }),
  head: () => ({ meta: [{ title: "Workspace Setup · DraftYard" }] }),
  loader: async ({ params, location }) => {
    try {
      // Fetch all drafts to find by slug
      let allDrafts: any[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const result = await fetchFeed({ page, limit: 50 });
        allDrafts = allDrafts.concat(result.data);
        hasMore = result.pagination.hasMore;
        page++;
      }
      
      const draft = allDrafts.find((d) => slugify(d.projectName) === params.slug);
      if (draft) {
        const workspace = await fetchWorkspace(draft._id);
        return { draft, workspace };
      }
    } catch {
      /* fallback */
    }
    const draft = drafts.find((d) => slugify(d.projectName) === params.slug);
    const workspace = draft?._id ? await fetchWorkspace(draft._id) : null;
    return { draft: draft ?? null, workspace };
  },
  component: WorkspaceSetupPage,
});

// ── Schema ──────────────────────────────────────────────────────
const step1Schema = z.object({
  longDescription: z.string().default(""),
  featuresCompleted: z.string().default(""),
  currentBlockers: z.string().default(""),
  externalLinks: z.string().optional().default(""),
});

const step2Schema = z.object({
  tasks: z.array(z.string()),
  milestones: z.array(z.string()),
});

const step3Schema = z.object({
  attachments: z.string().optional(),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;

// ── Page shell ──────────────────────────────────────────────────
function WorkspaceSetupPage() {
  const { draft, workspace } = Route.useLoaderData();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (draft && user) {
      const isOwner = draft.submittedBy === user._id || (draft.submittedBy as any)?._id === user._id;
      if (!isOwner) {
        toast.error("Only the project Owner can configure the workspace");
        navigate({ to: "/workspace", search: { draftId: undefined } });
      }
    }
  }, [draft, user, navigate]);

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          <AppSidebar />
          <SidebarInset className="flex min-w-0 flex-1 flex-col">
            <TopBar showGreeting={false} />
            <main className="flex-1 space-y-6 p-4 sm:p-6">
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>DraftYard</span>
                <ChevronRight className="h-3 w-3" />
                <span>{draft?.projectName ?? "Project"}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground">{workspace ? "Edit Workspace" : "Workspace Setup"}</span>
              </nav>
              <WorkspaceSetupForm draft={draft} existingWorkspace={workspace} />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

// ── Multi-step form ─────────────────────────────────────────────
function WorkspaceSetupForm({ draft, existingWorkspace }: { draft: { _id?: string; projectName: string } | null; existingWorkspace?: any }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const isEditMode = Boolean(existingWorkspace);

  // Step 2 state: dynamic task / milestone lists
  const [taskInputs, setTaskInputs] = useState<string[]>([""]);
  const [milestoneInputs, setMilestoneInputs] = useState<string[]>([""]);

  // Accumulated data across steps
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Values | null>(null);

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { longDescription: "", featuresCompleted: "", currentBlockers: "", externalLinks: "" },
    mode: "onChange",
  });

  const form3 = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: { attachments: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!isEditMode || !existingWorkspace) return;

    const initialTasks = (existingWorkspace.tasks || []).map((task: any) => task.title || "").filter(Boolean);
    const initialMilestones = (existingWorkspace.milestones || []).map((milestone: any) => milestone.label || "").filter(Boolean);

    form1.reset({
      longDescription: existingWorkspace.longDescription || "",
      featuresCompleted: existingWorkspace.featuresCompleted || "",
      currentBlockers: existingWorkspace.currentBlockers || "",
      externalLinks: existingWorkspace.externalLinks || "",
    });
    form3.reset({ attachments: existingWorkspace.attachments?.join("\n") || "" });
    setTaskInputs(initialTasks.length > 0 ? initialTasks : [""]);
    setMilestoneInputs(initialMilestones.length > 0 ? initialMilestones : [""]);
    setStep1Data({
      longDescription: existingWorkspace.longDescription || "",
      featuresCompleted: existingWorkspace.featuresCompleted || "",
      currentBlockers: existingWorkspace.currentBlockers || "",
      externalLinks: existingWorkspace.externalLinks || "",
    });
    setStep2Data({
      tasks: initialTasks.length > 0 ? initialTasks : [],
      milestones: initialMilestones.length > 0 ? initialMilestones : [],
    });
  }, [existingWorkspace, form1, form3, isEditMode]);

  const goNext = async () => {
    if (step === 1) {
      const ok = await form1.trigger();
      if (!ok) return;
      setStep1Data(form1.getValues());
      setStep(2);
    } else if (step === 2) {
      const validTasks = taskInputs.filter((t) => t.trim().length > 0);
      const validMilestones = milestoneInputs.filter((m) => m.trim().length > 0);
      setStep2Data({ tasks: validTasks, milestones: validMilestones });
      setStep(3);
    }
  };

  const goPrev = () => { if (step > 1) setStep(step - 1); };

  const onSubmit = async (values: Step3Values) => {
    if (!step1Data || !step2Data) return;

    // Validate that draft has an _id
    if (!draft?._id) {
      toast.error("Invalid draft. Please go back and select a valid draft.");
      return;
    }

    const wsTaskList: WorkspaceTask[] = step2Data.tasks.map((title, i) => ({
      id: `T-${String(i + 1).padStart(2, "0")}`,
      title,
      status: "Todo" as const,
      priority: (i === 0 ? "High" : "Medium") as "High" | "Medium" | "Low",
      assignee: "—",
    }));

    const wsMilestoneList: WorkspaceMilestone[] = step2Data.milestones.map((label, i) => ({
      id: `M-${i + 1}`,
      label,
      progress: 0,
    }));

    try {
      const payload = {
        draftId: draft._id,
        longDescription: step1Data.longDescription,
        featuresCompleted: step1Data.featuresCompleted,
        currentBlockers: step1Data.currentBlockers,
        externalLinks: step1Data.externalLinks ?? "",
        tasks: wsTaskList,
        milestones: wsMilestoneList,
        attachments: Array.isArray(values.attachments) ? values.attachments : (values.attachments ? [values.attachments] : []),
      };

      if (isEditMode && existingWorkspace) {
        await updateWorkspace(draft._id, payload);
        toast.success("Workspace updated.");
      } else {
        await createWorkspace(payload);
        toast.success("Workspace created! Let's build.");
      }

      navigate({ to: "/workspace", search: { draftId: draft._id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create workspace";
      toast.error(message);
    }
  };

  const STEPS = [
    { label: "Overview", icon: FileText },
    { label: "Tasks", icon: ListChecks },
    { label: "Team", icon: Users },
  ];

  return (
    <div className="mx-auto max-w-2xl mt-4">
      {/* Ambient glow — matches New Draft page */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-[80px]" />

      <div className="rounded-3xl border border-border/40 bg-card/45 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative">
        {/* Header */}
        <div className="text-center sm:text-left">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {isEditMode ? "Edit Workspace" : "Workspace Setup"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            {draft?.projectName
              ? isEditMode
                ? `Update the saved workspace details for ${draft.projectName}.`
                : `Setting up workspace for ${draft.projectName}. Fill in the details to unlock full AI insights.`
              : "Fill in the details to unlock full AI insights."}
          </p>
        </div>

        {/* Step progress bar — identical to New Draft */}
        <div className="relative mt-8 mb-8">
          <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 bg-muted/60" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-primary to-purple-500 -translate-y-1/2 transition-all duration-500 ease-out"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
          <div className="relative flex justify-between">
            {STEPS.map(({ label }, i) => {
              const s = i + 1;
              const active = step === s;
              const completed = step > s;
              return (
                <div key={s} className="flex flex-col items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300 ${
                    completed
                      ? "border-primary bg-primary text-primary-foreground"
                      : active
                        ? "border-primary bg-background text-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)] scale-110"
                        : "border-muted bg-muted/40 text-muted-foreground"
                  }`}>
                    {completed ? <Check className="h-4 w-4" /> : s}
                  </div>
                  <span className={`mt-2 text-[11px] font-medium transition-colors duration-300 hidden sm:block ${
                    active ? "text-foreground font-semibold" : "text-muted-foreground"
                  }`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STEP 1: Overview ── */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1"
              initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
              <Form {...form1}>
                <div className="space-y-5">
                  <FormField control={form1.control} name="longDescription" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Long Description <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the project in detail — what it does, who it's for, what makes it unique..." rows={4} className="rounded-xl resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form1.control} name="featuresCompleted" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features Completed <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g. Auth system, dashboard UI, REST API endpoints..." rows={3} className="rounded-xl resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form1.control} name="currentBlockers" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Blockers <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g. Payment integration failing, no deployment pipeline, need mobile dev..." rows={3} className="rounded-xl resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form1.control} name="externalLinks" render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Links <span className="text-xs text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="GitHub, Figma, Notion, deployment URL..." className="h-10 rounded-xl" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">Comma-separated links</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </Form>
            </motion.div>
          )}

          {/* ── STEP 2: Tasks & Milestones ── */}
          {step === 2 && (
            <motion.div key="s2"
              initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-6">
              {/* Tasks */}
              <div>
                <label className="text-sm font-medium leading-none">
                  Tasks <span className="text-destructive">*</span>
                </label>
                <p className="mt-1 text-xs text-muted-foreground">What needs to be done to move this project forward?</p>
                <div className="mt-3 space-y-2">
                  {taskInputs.map((val, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border text-[10px] font-semibold text-muted-foreground">
                        {i + 1}
                      </div>
                      <Input
                        value={val}
                        onChange={(e) => {
                          const next = [...taskInputs];
                          next[i] = e.target.value;
                          setTaskInputs(next);
                        }}
                        placeholder={`Task ${i + 1} — e.g. Build auth API`}
                        className="h-10 rounded-xl flex-1"
                      />
                      {taskInputs.length > 1 && (
                        <button type="button" onClick={() => setTaskInputs(taskInputs.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setTaskInputs([...taskInputs, ""])}
                    className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add task
                  </button>
                </div>
              </div>
              {/* Milestones */}
              <div>
                <label className="text-sm font-medium leading-none">
                  Milestones <span className="text-destructive">*</span>
                </label>
                <p className="mt-1 text-xs text-muted-foreground">Key checkpoints for this project's revival.</p>
                <div className="mt-3 space-y-2">
                  {milestoneInputs.map((val, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                        M
                      </div>
                      <Input
                        value={val}
                        onChange={(e) => {
                          const next = [...milestoneInputs];
                          next[i] = e.target.value;
                          setMilestoneInputs(next);
                        }}
                        placeholder={`Milestone ${i + 1} — e.g. MVP Features`}
                        className="h-10 rounded-xl flex-1"
                      />
                      {milestoneInputs.length > 1 && (
                        <button type="button" onClick={() => setMilestoneInputs(milestoneInputs.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setMilestoneInputs([...milestoneInputs, ""])}
                    className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add milestone
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Team / Attachments ── */}
          {step === 3 && (
            <motion.div key="s3"
              initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
              <Form {...form3}>
                <form onSubmit={form3.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form3.control} name="attachments" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attachments / Notes <span className="text-xs text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes, file names, or links to relevant resources (design files, docs, recordings)..."
                          rows={5}
                          className="rounded-xl resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        File uploads can be added later from inside the workspace.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Summary preview */}
                  {step1Data && step2Data && (
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Setup Summary</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-medium text-foreground">Tasks:</span>{" "}
                          <span className="text-muted-foreground">{step2Data.tasks.length} added</span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Milestones:</span>{" "}
                          <span className="text-muted-foreground">{step2Data.milestones.length} added</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-foreground">Blockers:</span>{" "}
                          <span className="text-muted-foreground line-clamp-1">{step1Data.currentBlockers}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nav buttons for step 3 */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <Button type="button" variant="ghost" onClick={goPrev} className="rounded-xl flex items-center gap-1.5 h-10">
                      <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-xl h-10 font-medium bg-gradient-to-r from-primary to-purple-600 hover:brightness-110 shadow-lg"
                    >
                      {isEditMode ? "Save Changes" : "Create Workspace"}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">
                    You can update all details from inside your workspace at any time.
                  </p>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav buttons for steps 1 & 2 */}
        {step < 3 && (
          <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-6">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={goPrev} className="rounded-xl flex items-center gap-1.5 h-10">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : <div />}
            <Button type="button" onClick={goNext} className="rounded-xl flex items-center gap-1.5 h-10">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
