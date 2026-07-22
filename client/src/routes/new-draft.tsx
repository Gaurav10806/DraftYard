import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDraft } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { getOwnerToken } from "@/lib/owner-token";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronLeft,
  CalendarIcon,
  X,
  Search,
  Sparkles,
  Check,
  Plus,
} from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/new-draft")({
  head: () => ({
    meta: [
      { title: "New Draft · DraftYard" },
      {
        name: "description",
        content: "Redesign the essentials of your project now. Enrich later for deeper AI insights.",
      },
    ],
  }),
  component: NewDraftPage,
});

const schema = z.object({
  projectName: z.string().min(1, "Project Name is required"),
  oneLiner: z.string().min(1, "One-line Description is required"),
  category: z.string().min(1, "Category is required"),
  techStack: z.array(z.string()).min(1, "At least one technology is required"),
  currentStage: z.string().min(1, "Current Stage is required"),
  lastWorkedOn: z.date({ required_error: "Last Worked On date is required" }),
  visibility: z.enum(["Public", "Private"]),
  openForRevival: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const CATEGORY_OPTIONS = [
  "Web Application",
  "Mobile Application",
  "AI / ML",
  "Desktop Application",
  "API / Backend",
  "Game",
  "IoT",
  "Blockchain",
  "Library / SDK",
  "Browser Extension",
  "Other",
];

const STAGE_OPTIONS = [
  "Idea",
  "Planning",
  "Prototype",
  "Development",
  "Testing",
  "Deployment",
  "Released",
];

const POPULAR_TECHS = [
  "React",
  "React Native",
  "Next.js",
  "Vue",
  "Angular",
  "Svelte",
  "Node.js",
  "Express",
  "NestJS",
  "Python",
  "Django",
  "FastAPI",
  "Flask",
  "Go",
  "Rust",
  "C++",
  "C#",
  "Java",
  "Spring Boot",
  "TypeScript",
  "JavaScript",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "PostgreSQL",
  "MongoDB",
  "MySQL",
  "SQLite",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "Google Cloud",
  "Vercel",
  "Netlify",
  "Firebase",
  "Supabase",
  "Prisma",
  "GraphQL",
  "Solidity",
  "Flutter",
  "Unity",
  "TensorFlow",
  "PyTorch",
];

const CATEGORY_TO_DOMAIN: Record<string, string> = {
  "Web Application": "web",
  "Mobile Application": "mobile",
  "AI / ML": "ml",
  "Game": "game",
  "IoT": "hardware",
  "Desktop Application": "other",
  "API / Backend": "other",
  "Library / SDK": "other",
  "Browser Extension": "other",
  "Blockchain": "other",
  "Other": "other",
};

const STAGE_MAP: Record<string, string> = {
  "Idea": "Idea only",
  "Planning": "Idea only",
  "Prototype": "Prototype",
  "Development": "50% done",
  "Testing": "Almost complete",
  "Deployment": "Almost complete",
  "Released": "Launched but abandoned",
};

function NewDraftPage() {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          <AppSidebar />
          <SidebarInset className="flex min-w-0 flex-1 flex-col">
            <TopBar showGreeting={false} />
            <main className="flex-1 space-y-6 p-4 sm:p-6">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>DraftYard</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground">New Draft</span>
              </nav>

              <NewDraftForm />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

function NewDraftForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Tech stack search autocomplete state
  const [techQuery, setTechQuery] = useState("");
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  const techInputRef = useRef<HTMLInputElement>(null);
  const techContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectName: "",
      oneLiner: "",
      category: "",
      techStack: [],
      currentStage: "",
      lastWorkedOn: undefined,
      visibility: "Public",
      openForRevival: false,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: createDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Draft created successfully.");
      navigate({ to: "/dashboard" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create draft");
    },
  });

  function onSubmit(values: FormValues) {
    mutation.mutate({
      projectName: values.projectName,
      oneLiner: values.oneLiner,
      domain: CATEGORY_TO_DOMAIN[values.category] || "other",
      techStack: values.techStack,
      teamSize: "solo", // Default required backend field
      stageDied: STAGE_MAP[values.currentStage] || "Idea only", // Default/Mapped backend stage
      whyItDied: "Draft created via Quick Onboarding", // Default required backend field
      timeSpent: { value: 1, unit: "weeks" }, // Default required backend field
      salvageable: "",
      projectLink: "",
      openForRevival: values.openForRevival,
      isAnonymous: false, // Default value
      ownerToken: getOwnerToken(),
    });
  }

  // Handle tech stack click outside suggestion dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (techContainerRef.current && !techContainerRef.current.contains(event.target as Node)) {
        setIsTechDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedTechs = form.watch("techStack") || [];

  const addTech = (tech: string) => {
    const trimmed = tech.trim();
    if (trimmed && !selectedTechs.includes(trimmed)) {
      const updated = [...selectedTechs, trimmed];
      form.setValue("techStack", updated, { shouldValidate: true });
    }
    setTechQuery("");
    setIsTechDropdownOpen(false);
    techInputRef.current?.focus();
  };

  const removeTech = (tech: string) => {
    const updated = selectedTechs.filter((t) => t !== tech);
    form.setValue("techStack", updated, { shouldValidate: true });
  };

  const filteredTechs = POPULAR_TECHS.filter(
    (t) =>
      t.toLowerCase().includes(techQuery.toLowerCase()) &&
      !selectedTechs.some((st) => st.toLowerCase() === t.toLowerCase())
  );

  const goNext = async () => {
    if (step === 1) {
      const isValid = await form.trigger(["projectName", "oneLiner", "category"]);
      if (isValid) setStep(2);
    } else if (step === 2) {
      const isValid = await form.trigger(["techStack", "currentStage", "lastWorkedOn"]);
      if (isValid) setStep(3);
    }
  };

  const goPrev = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="mx-auto max-w-2xl mt-4">
      {/* Visual Ambient Glow for Premium Vibe */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-[80px]" />

      <div className="rounded-3xl border border-border/40 bg-card/45 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative">
        {/* Header */}
        <div className="text-center sm:text-left">
          <h1 className="font-display text-3xl font-semibold tracking-tight">New Draft</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Tell us the essentials now. You can enrich your draft later for deeper AI insights.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="relative mt-8 mb-8">
          <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 bg-muted/60" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-primary to-purple-500 -translate-y-1/2 transition-all duration-500 ease-out"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />

          <div className="relative flex justify-between">
            {[1, 2, 3].map((s) => {
              const active = step === s;
              const completed = step > s;
              return (
                <div key={s} className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300 ${
                      completed
                        ? "border-primary bg-primary text-primary-foreground"
                        : active
                          ? "border-primary bg-background text-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)] scale-110"
                          : "border-muted bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {completed ? <Check className="h-4 w-4" /> : s}
                  </div>
                  <span
                    className={`mt-2 text-[11px] font-medium transition-colors duration-300 hidden sm:block ${
                      active ? "text-foreground font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {s === 1 && "Identity"}
                    {s === 2 && "Tech & Progress"}
                    {s === 3 && "Preferences"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="SprintSense" className="h-10 rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="oneLiner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>One-line Description</FormLabel>
                        <FormControl>
                          <Input placeholder="What was it supposed to do?" className="h-10 rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xl">
                              <SelectValue placeholder="Select a project category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-5"
                >
                  {/* Tech Stack Custom Multi-Select */}
                  <FormField
                    control={form.control}
                    name="techStack"
                    render={() => (
                      <FormItem>
                        <FormLabel>Tech Stack</FormLabel>
                        <div ref={techContainerRef} className="relative space-y-2">
                          <div className="relative flex items-center">
                            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              ref={techInputRef}
                              type="text"
                              value={techQuery}
                              onChange={(e) => {
                                setTechQuery(e.target.value);
                                setIsTechDropdownOpen(true);
                              }}
                              onFocus={() => setIsTechDropdownOpen(true)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (techQuery.trim()) {
                                    addTech(techQuery);
                                  }
                                }
                              }}
                              placeholder="Search or type custom technology..."
                              className="pl-9 h-10 rounded-xl"
                            />
                          </div>

                          {/* Autocomplete Dropdown list */}
                          {isTechDropdownOpen && (techQuery.trim().length > 0 || filteredTechs.length > 0) && (
                            <div className="absolute z-50 w-full rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-lg backdrop-blur-md max-h-56 overflow-y-auto mt-1 p-1">
                              {techQuery.trim().length > 0 && !selectedTechs.includes(techQuery.trim()) && (
                                <button
                                  type="button"
                                  onClick={() => addTech(techQuery)}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted text-left text-primary font-medium"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add custom: "{techQuery.trim()}"
                                </button>
                              )}
                              {filteredTechs.map((tech) => (
                                <button
                                  key={tech}
                                  type="button"
                                  onClick={() => addTech(tech)}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted text-left"
                                >
                                  {tech}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Removable chips */}
                          {selectedTechs.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {selectedTechs.map((tech) => (
                                <Badge
                                  key={tech}
                                  variant="secondary"
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-border/50 bg-background/50 hover:bg-muted transition-colors"
                                >
                                  {tech}
                                  <button
                                    type="button"
                                    onClick={() => removeTech(tech)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Current Stage */}
                  <FormField
                    control={form.control}
                    name="currentStage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Stage</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xl">
                              <SelectValue placeholder="Select current project stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STAGE_OPTIONS.map((stg) => (
                              <SelectItem key={stg} value={stg}>
                                {stg}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Last Worked On Date Picker */}
                  <FormField
                    control={form.control}
                    name="lastWorkedOn"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="mb-1">Last Worked On</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className={`w-full h-10 rounded-xl pl-3 text-left font-normal border-input hover:bg-muted ${
                                  !field.value && "text-muted-foreground"
                                }`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  {/* Visibility Preferences */}
                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Visibility</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4"
                          >
                            <label
                              className={`flex flex-col items-start rounded-2xl border p-4 hover:bg-muted/30 cursor-pointer transition-all duration-200 ${
                                field.value === "Public"
                                  ? "border-primary bg-primary/5 shadow-[0_0_12px_rgba(var(--primary-rgb),0.05)]"
                                  : "border-border/60"
                              }`}
                            >
                              <div className="flex items-center gap-2 font-semibold">
                                <RadioGroupItem value="Public" id="r-public" className="h-4 w-4" />
                                <span>Public</span>
                              </div>
                              <span className="mt-1 text-[11px] text-muted-foreground leading-normal">
                                Visible to anyone on DraftYard feed. Perfect for open collab.
                              </span>
                            </label>

                            <label
                              className={`flex flex-col items-start rounded-2xl border p-4 hover:bg-muted/30 cursor-pointer transition-all duration-200 ${
                                field.value === "Private"
                                  ? "border-primary bg-primary/5 shadow-[0_0_12px_rgba(var(--primary-rgb),0.05)]"
                                  : "border-border/60"
                              }`}
                            >
                              <div className="flex items-center gap-2 font-semibold">
                                <RadioGroupItem value="Private" id="r-private" className="h-4 w-4" />
                                <span>Private</span>
                              </div>
                              <span className="mt-1 text-[11px] text-muted-foreground leading-normal">
                                Only visible to you. Kept safely in your private workspace.
                              </span>
                            </label>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Open for Revival Toggle */}
                  <FormField
                    control={form.control}
                    name="openForRevival"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/60 p-4 bg-muted/10">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                            Open for Revival
                            <Sparkles className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />
                          </FormLabel>
                          <FormDescription className="text-xs max-w-sm">
                            Allow other builders to raise their hands and request to co-build or revive this idea.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-6">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goPrev}
                  className="rounded-xl flex items-center gap-1.5 hover:bg-muted/50 h-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={goNext}
                  className="rounded-xl flex items-center gap-1.5 h-10"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex flex-col items-end w-full sm:w-auto">
                  <Button
                    type="submit"
                    disabled={!form.formState.isValid || mutation.isPending}
                    className="rounded-xl w-full sm:w-auto h-10 font-medium bg-gradient-to-r from-primary to-purple-600 hover:brightness-110 shadow-lg"
                  >
                    {mutation.isPending ? "Creating..." : "Create Draft"}
                  </Button>
                </div>
              )}
            </div>

            {step === 3 && (
              <p className="text-[11px] text-muted-foreground text-center mt-4">
                You can add more details later from your Draft Workspace to unlock richer AI insights.
              </p>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}