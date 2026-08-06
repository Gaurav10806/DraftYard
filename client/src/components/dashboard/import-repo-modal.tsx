import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Github,
  Search,
  Loader2,
  CheckCircle2,
  Lock,
  Globe,
  Star,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { githubApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface ImportRepoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type GithubRepo = {
  id: number | string;
  name: string;
  description: string;
  html_url: string;
  language: string;
  languages_url: string;
  topics: string[];
  private: boolean;
  default_branch: string;
  updated_at: string;
  owner: string;
  stargazers_count: number;
};

type Step = "idle" | "fetching" | "reading_metadata" | "reading_readme" | "creating_draft" | "creating_workspace" | "publishing" | "updating_active" | "done";

export function ImportRepoModal({ open, onOpenChange }: ImportRepoModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [importingRepoId, setImportingRepoId] = useState<number | string | null>(null);
  const [importStep, setImportStep] = useState<Step>("idle");
  const [alreadyImportedDraftId, setAlreadyImportedDraftId] = useState<string | null>(null);

  useEffect(() => {
    if (open && user?.github?.connected) {
      setLoading(true);
      setError(null);
      githubApi
        .getRepos()
        .then((data) => setRepos(data))
        .catch((err) => {
          setError(err.message || "Failed to fetch repositories");
        })
        .finally(() => setLoading(false));
    }
  }, [open, user?.github?.connected]);

  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(search.toLowerCase())) ||
      (repo.language && repo.language.toLowerCase().includes(search.toLowerCase()))
  );

  const handleImport = async (repo: GithubRepo) => {
    setImportingRepoId(repo.id);
    setAlreadyImportedDraftId(null);

    // Progressive step animation
    setImportStep("fetching");
    await new Promise((r) => setTimeout(r, 400));
    setImportStep("reading_metadata");
    await new Promise((r) => setTimeout(r, 400));
    setImportStep("reading_readme");

    try {
      setImportStep("creating_draft");
      const res = await githubApi.importRepo(repo.id);

      if (res.alreadyImported) {
        toast.info("This repository has already been imported.");
        setAlreadyImportedDraftId(res.draftId || res.draft?._id || null);
        setImportingRepoId(null);
        setImportStep("idle");
        return;
      }

      setImportStep("creating_workspace");
      await new Promise((r) => setTimeout(r, 300));
      setImportStep("publishing");
      await new Promise((r) => setTimeout(r, 300));
      setImportStep("updating_active");
      await new Promise((r) => setTimeout(r, 300));
      setImportStep("done");

      // Invalidate queries so feed, my drafts, active draft, and workspace hub refresh
      await queryClient.invalidateQueries({ queryKey: ["my-drafts"] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      await queryClient.invalidateQueries({ queryKey: ["user-insights"] });

      // Update Active Draft in localStorage
      if (res.draft?._id) {
        localStorage.setItem("activeDraftId", res.draft._id);
        window.dispatchEvent(new Event("activeDraftChanged"));
      }

      toast.success(`"${repo.name}" imported successfully!`);
      onOpenChange(false);

      // Redirect immediately to the newly created workspace
      const newDraftId = res.draft?._id;
      if (newDraftId) {
        navigate({ to: "/workspace", search: { draftId: newDraftId } });
      }
    } catch (err: any) {
      if (err.status === 409 || err.alreadyImported) {
        toast.info("This repository has already been imported.");
        setAlreadyImportedDraftId(err.draftId || null);
      } else {
        toast.error(err.message || "Failed to import repository");
      }
      setImportingRepoId(null);
      setImportStep("idle");
    }
  };

  const stepsList: { key: Step; label: string }[] = [
    { key: "fetching", label: "Fetching Repository" },
    { key: "reading_metadata", label: "Reading Metadata" },
    { key: "reading_readme", label: "Reading README" },
    { key: "creating_draft", label: "Creating Draft" },
    { key: "creating_workspace", label: "Creating Workspace" },
    { key: "publishing", label: "Publishing to Feed" },
    { key: "updating_active", label: "Updating Active Draft" },
    { key: "done", label: "Done" },
  ];

  const getStepStatus = (stepKey: Step) => {
    const order: Step[] = [
      "fetching",
      "reading_metadata",
      "reading_readme",
      "creating_draft",
      "creating_workspace",
      "publishing",
      "updating_active",
      "done",
    ];
    const currentIndex = order.indexOf(importStep);
    const targetIndex = order.indexOf(stepKey);

    if (currentIndex > targetIndex) return "completed";
    if (currentIndex === targetIndex) return "active";
    return "pending";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-card p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-semibold">
            <Github className="h-5 w-5 text-primary" />
            Import Repository
          </DialogTitle>
          <DialogDescription>
            Select a GitHub repository to automatically transform it into a DraftYard project.
          </DialogDescription>
        </DialogHeader>

        {importingRepoId !== null ? (
          <div className="my-6 rounded-2xl border border-border/80 bg-background/50 p-6 space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Importing Repository...
            </h4>
            <div className="space-y-2 text-xs">
              {stepsList.map((st) => {
                const status = getStepStatus(st.key);
                return (
                  <div key={st.key} className="flex items-center gap-2.5">
                    {status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : status === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                    )}
                    <span
                      className={`font-medium ${
                        status === "completed"
                          ? "text-foreground"
                          : status === "active"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories..."
                className="pl-9 bg-background/60 rounded-xl"
              />
            </div>

            {/* Repositories List */}
            <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  Fetching your GitHub repositories...
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-rose-500 gap-2">
                  <AlertCircle className="h-6 w-6" />
                  {error}
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {search ? "No repositories match your search." : "No GitHub repositories found."}
                </div>
              ) : (
                filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 hover:border-primary/40 transition-colors shadow-sm"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {repo.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="h-4 gap-1 text-[10px] px-1.5 rounded-md border-border"
                        >
                          {repo.private ? (
                            <>
                              <Lock className="h-2.5 w-2.5 text-amber-500" /> Private
                            </>
                          ) : (
                            <>
                              <Globe className="h-2.5 w-2.5 text-emerald-500" /> Public
                            </>
                          )}
                        </Badge>
                        {repo.language && (
                          <Badge variant="secondary" className="h-4 text-[10px] px-1.5 rounded-md">
                            {repo.language}
                          </Badge>
                        )}
                        {repo.stargazers_count > 0 && (
                          <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {repo.stargazers_count}
                          </span>
                        )}
                      </div>

                      {repo.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {repo.description}
                        </p>
                      )}

                      {repo.topics && repo.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {repo.topics.slice(0, 4).map((topic) => (
                            <span
                              key={topic}
                              className="text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md"
                            >
                              #{topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleImport(repo)}
                        className="h-8 rounded-xl text-xs gap-1.5 px-3"
                      >
                        <Github className="h-3.5 w-3.5" />
                        Import
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {alreadyImportedDraftId && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
            <span>This repository has already been imported into DraftYard.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                navigate({ to: "/workspace", search: { draftId: alreadyImportedDraftId } });
              }}
              className="h-7 text-xs gap-1 border-amber-500/40 hover:bg-amber-500/20"
            >
              Open Workspace <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
