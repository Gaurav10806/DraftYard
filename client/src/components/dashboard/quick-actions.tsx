import { useState } from "react";
import { Archive, Edit3, Rocket, Share2, Skull, UserPlus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { drafts } from "@/data/drafts";
import { slugify } from "@/routes/project.$slug";

export function QuickActions() {
  const navigate = useNavigate();
  const activeDraft = drafts[0];
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");

  const handleAction = (label: string) => {
    switch (label) {
      case "Edit Draft":
        navigate({ to: "/project/$slug", params: { slug: slugify(activeDraft.projectName) } });
        break;
      case "Open Autopsy Room":
        toast("Autopsy Room is on the roadmap — not built yet 💀");
        break;
      case "Invite Teammate":
        setInviteOpen(true);
        break;
      case "Share Draft": {
        const url = `${window.location.origin}/project/${slugify(activeDraft.projectName)}`;
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(url);
          toast("Draft link copied to clipboard");
        } else {
          toast(`Share link: ${url}`);
        }
        break;
      }
      case "Publish Draft":
        toast(`${activeDraft.projectName} published to the feed`);
        break;
      case "Archive Draft":
        toast(`${activeDraft.projectName} archived`);
        break;
    }
  };

  const sendInvite = () => {
    if (!email.trim() || !email.includes("@")) {
      toast("Enter a valid email to invite a teammate");
      return;
    }
    toast(`Invite sent to ${email.trim()}`);
    setEmail("");
    setInviteOpen(false);
  };

  const actions = [
    { icon: Edit3, label: "Edit Draft", tint: "bg-tint-lilac" },
    { icon: Skull, label: "Open Autopsy Room", tint: "bg-tint-sky" },
    { icon: UserPlus, label: "Invite Teammate", tint: "bg-tint-mint" },
    { icon: Share2, label: "Share Draft", tint: "bg-tint-peach" },
    { icon: Rocket, label: "Publish Draft", tint: "bg-tint-lilac" },
    { icon: Archive, label: "Archive Draft", tint: "bg-tint-mint" },
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
        Quick Actions
      </h2>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => handleAction(a.label)}
            className="group flex h-full flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition-all duration-[220ms] hover:border-primary/60 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${a.tint}`}>
              <a.icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium leading-tight">{a.label}</span>
          </button>
        ))}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a teammate</DialogTitle>
            <DialogDescription>
              Send an invite to collaborate on {activeDraft.projectName}.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            placeholder="teammate@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendInvite()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendInvite}>Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
