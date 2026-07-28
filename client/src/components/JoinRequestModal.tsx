import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, X, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";

const SKILL_OPTIONS = [
  "React",
  "Node",
  "MongoDB",
  "Next.js",
  "Python",
  "UI/UX",
  "TypeScript",
  "Tailwind",
];

interface JoinRequestModalProps {
  projectName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    contact: string;
    message: string;
    skills: string[];
    estimatedTime: string;
  }) => Promise<void>;
  title?: string;
  subtitle?: string;
}

export function JoinRequestModal({
  projectName,
  open,
  onOpenChange,
  onSubmit,
  title = "Raise Your Hand",
  subtitle = "Show the original creator you want to revive or collaborate on their project.",
}: JoinRequestModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [skills, setSkills] = useState<string[]>(["React", "Node"]);
  const [estimatedTime, setEstimatedTime] = useState("2-4 weeks");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      if (user?.name) setName(user.name);
      if (user?.email) setContact(user.email);
      setDone(false);
    }
  }, [open, user]);

  const toggleSkill = (s: string) => {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        contact: contact.trim(),
        message: message.trim(),
        skills,
        estimatedTime,
      });
      setDone(true);
    } catch (_) {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setDone(false);
      }}
    >
      <DialogContent className="max-w-lg overflow-hidden border-border/80 bg-card p-0 shadow-2xl [&>button]:hidden">
        <div className="relative p-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 font-display text-lg">
              <Hand className="h-4 w-4 text-primary" />
              {title}
            </DialogTitle>
            <DialogDescription>{subtitle}</DialogDescription>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
                <Check className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">Request Sent!</h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                The project owner will receive a notification in their dashboard and can review your request.
              </p>
              <Button onClick={() => onOpenChange(false)} className="mt-4 rounded-full px-6">
                Done
              </Button>
            </div>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 space-y-4"
                >
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-foreground">Project</span>
                    <Input readOnly value={projectName ?? "Untitled Draft"} className="bg-muted/40" />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-foreground">Your Name *</span>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Dev Cosmos"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-foreground">Contact Info *</span>
                      <Input
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="Email / Discord / GitHub"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-foreground">Why do you want to join/revive this?</span>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="Share why this excites you and what you can contribute…"
                      className="resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-foreground">Relevant Skills</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {SKILL_OPTIONS.map((s) => {
                        const on = skills.includes(s);
                        return (
                          <label
                            key={s}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                              on
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/60 text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            <Checkbox
                              checked={on}
                              onCheckedChange={() => toggleSkill(s)}
                              className="h-3 w-3"
                            />
                            {s}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-foreground">Estimated Time Commitment</span>
                    <Select value={estimatedTime} onValueChange={setEstimatedTime}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2 weeks">1–2 weeks</SelectItem>
                        <SelectItem value="2-4 weeks">2–4 weeks</SelectItem>
                        <SelectItem value="1 month">1 month</SelectItem>
                        <SelectItem value="More than 1 month">More than 1 month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              </AnimatePresence>

              <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!name.trim() || submitting}
                  className="rounded-full px-5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
