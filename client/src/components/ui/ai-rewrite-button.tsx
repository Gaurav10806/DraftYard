import React, { useState } from "react";
import { Sparkles, Loader2, Check, Plus, RefreshCw, CheckCircle2, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { rewriteWithAi } from "@/lib/api";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

interface AiRewriteButtonProps {
  text: string;
  contextType?: "project_description" | "pitch" | "workspace" | "bio";
  onApply: (newText: string, mode: "replace" | "append") => void;
  className?: string;
}

// In-memory cache for input -> rewritten text
const rewriteCache = new Map<string, string>();

export function AiRewriteButton({
  text,
  contextType = "project_description",
  onApply,
  className = "",
}: AiRewriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [improvedText, setImprovedText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleRewrite = async (forceBypassCache = false) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (!forceBypassCache && rewriteCache.has(trimmed)) {
      setImprovedText(rewriteCache.get(trimmed)!);
      setPreviewOpen(true);
      return;
    }

    setLoading(true);
    try {
      const result = await rewriteWithAi({ text: trimmed, contextType });
      if (!result || result.trim().length === 0) {
        toast.info("We need a little more information before we can improve this description.");
        return;
      }
      rewriteCache.set(trimmed, result);
      setImprovedText(result);
      setPreviewOpen(true);
    } catch (err: any) {
      console.error("AI Rewrite error:", err);
      toast.error("Unable to improve the description. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (mode: "replace" | "append") => {
    onApply(improvedText, mode);
    setPreviewOpen(false);
    toast.success(
      mode === "replace"
        ? "Description replaced with AI version!"
        : "AI version appended to your description!"
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(improvedText);
    setCopied(true);
    toast.success("AI description copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleRewrite(false)}
        disabled={loading || !text.trim()}
        className={`h-9 gap-2 rounded-xl border-primary/40 bg-primary/10 text-xs font-semibold text-primary transition-all hover:bg-primary/20 hover:border-primary active:scale-95 disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Improving your description…</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Rewrite with AI</span>
          </>
        )}
      </Button>

      {/* Redesigned Glassmorphic Comparison Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-primary-foreground shadow-md">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <DialogTitle className="font-display text-lg font-bold tracking-tight text-foreground">
                    ✨ AI Improved Description
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Refined, professional summary generated for optimal AI analysis.
                  </DialogDescription>
                </div>
              </div>

              {/* Improvement Badges */}
              <div className="hidden sm:flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Better clarity
                </Badge>
                <Badge variant="outline" className="text-[10px] text-violet-500 border-violet-500/30 bg-violet-500/10">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Professional
                </Badge>
                <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/10">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> AI-Ready
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Comparison Cards Layout */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Original Card */}
            <div className="flex flex-col rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Original Description
                </span>
                <Badge variant="secondary" className="text-[9px]">User Input</Badge>
              </div>
              <div className="flex-1 overflow-y-auto max-h-72 rounded-xl bg-background/60 p-3.5 text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap border border-border/40">
                {text}
              </div>
            </div>

            {/* Improved Version Card */}
            <div className="flex flex-col rounded-xl border border-primary/40 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Improved Version
                </span>
                <Badge className="bg-primary text-primary-foreground text-[9px] font-bold">
                  ✨ Enhanced
                </Badge>
              </div>
              <div className="flex-1 overflow-y-auto max-h-72 rounded-xl bg-card p-4 text-foreground leading-relaxed border border-primary/20 shadow-sm">
                <MarkdownRenderer content={improvedText} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRewrite(true)}
              disabled={loading}
              className="h-9 gap-1.5 rounded-xl text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Try Again
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-9 gap-1.5 rounded-xl border-border text-xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAction("append")}
                className="h-9 gap-1.5 rounded-xl border-border text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Append
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleAction("replace")}
                className="h-9 gap-1.5 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-md"
              >
                <Check className="h-3.5 w-3.5" /> Replace Current
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
