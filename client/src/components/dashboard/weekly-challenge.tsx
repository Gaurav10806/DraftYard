import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  Medal,
  Award,
  Crown,
  Zap,
  LayoutGrid,
  ArrowRight,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Search,
  ArrowUpDown,
  Target,
  ShieldCheck,
  Check,
  UserCheck,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchActiveChallenge,
  fetchAllChallenges,
  joinChallenge,
  fetchChallengeLeaderboard,
  Challenge,
  ChallengeParticipant,
  LeaderboardEntry,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// Map reward icon strings to Lucide Icon components
function getRewardIcon(iconName: string) {
  switch (iconName?.toLowerCase()) {
    case "star":
      return Star;
    case "medal":
      return Medal;
    case "award":
      return Award;
    case "crown":
      return Crown;
    case "zap":
      return Zap;
    case "trophy":
    default:
      return Trophy;
  }
}

// Live ticking countdown hook
function useCountdown(targetDateStr?: string, onExpire?: () => void) {
  const calc = () => {
    if (!targetDateStr) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    const diff = Math.max(0, new Date(targetDateStr).getTime() - Date.now());
    const isExpired = diff <= 0;
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1000);
    return { days, hours, minutes, seconds, isExpired };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => {
      const updated = calc();
      setTime(updated);
      if (updated.isExpired && onExpire) {
        onExpire();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDateStr]);

  return time;
}

// Inline Countdown badge component for cards
function ChallengeCountdownBadge({ targetDateStr }: { targetDateStr: string }) {
  const timer = useCountdown(targetDateStr);

  if (timer.isExpired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-muted bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
        Expired
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-500 dark:text-amber-400">
      <Clock className="h-3 w-3" />
      {timer.days > 0 ? `${timer.days}D ` : ""}
      {timer.hours}H {timer.minutes}M {timer.seconds}S Left
    </span>
  );
}

export function WeeklyChallenge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // State for View All Challenges modal dialog
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatusFilter, setModalStatusFilter] = useState<string>("all");
  const [modalSortBy, setModalSortBy] = useState<string>("endingSoon");
  const [modalSearchQuery, setModalSearchQuery] = useState<string>("");
  const [leaderboardModalId, setLeaderboardModalId] = useState<string | null>(null);

  // Fetch active challenge for widget
  const {
    data: activeData,
    isLoading: isActiveLoading,
    isError: isActiveError,
    refetch: refetchActive,
  } = useQuery({
    queryKey: ["activeChallenge"],
    queryFn: fetchActiveChallenge,
    refetchInterval: 30000,
  });

  const challenge: Challenge | undefined = activeData?.challenge;
  const userParticipation: ChallengeParticipant | null | undefined = activeData?.userParticipation;

  const timer = useCountdown(challenge?.endDate, () => {
    queryClient.invalidateQueries({ queryKey: ["activeChallenge"] });
  });

  // Fetch all challenges query for the popup modal dialog
  const {
    data: modalChallengesData,
    isLoading: isModalLoading,
    refetch: refetchModal,
  } = useQuery({
    queryKey: ["allChallengesModal", modalStatusFilter, modalSortBy, modalSearchQuery],
    queryFn: () =>
      fetchAllChallenges({
        status: modalStatusFilter === "all" ? undefined : modalStatusFilter,
        sort: modalSortBy,
        search: modalSearchQuery,
      }),
    enabled: isModalOpen,
  });

  const modalChallenges: Challenge[] = modalChallengesData?.challenges || [];

  // Leaderboard Query
  const {
    data: leaderboardData,
    isLoading: isLeaderboardLoading,
  } = useQuery({
    queryKey: ["challengeLeaderboardModal", leaderboardModalId],
    queryFn: () => (leaderboardModalId ? fetchChallengeLeaderboard(leaderboardModalId) : null),
    enabled: Boolean(leaderboardModalId),
  });

  const leaderboardEntries: LeaderboardEntry[] = leaderboardData?.leaderboard || [];

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: (challengeId: string) => joinChallenge(challengeId),
    onSuccess: (res) => {
      toast.success(res.message || "You've joined the challenge! Good luck 🏆");
      queryClient.invalidateQueries({ queryKey: ["activeChallenge"] });
      queryClient.invalidateQueries({ queryKey: ["allChallengesModal"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to join challenge");
    },
  });

  const handleJoin = (challengeId?: string) => {
    if (!user) {
      toast.error("Please sign in to join challenges!");
      return;
    }
    const idToJoin = challengeId || challenge?._id;
    if (!idToJoin) return;
    joinMutation.mutate(idToJoin);
  };

  // Loading Skeleton State for Dashboard Widget
  if (isActiveLoading) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-3 w-28 rounded bg-muted/70" />
          <div className="h-6 w-20 rounded-full bg-muted/70" />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-muted/70 shrink-0" />
          <div className="h-3 w-32 rounded bg-muted/70" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-6 w-3/4 rounded bg-muted/70" />
          <div className="h-4 w-full rounded bg-muted/70" />
          <div className="h-4 w-5/6 rounded bg-muted/70" />
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-3 w-16 rounded bg-muted/70" />
          <div className="flex gap-2">
            <div className="h-7 w-24 rounded-lg bg-muted/70" />
            <div className="h-7 w-28 rounded-lg bg-muted/70" />
          </div>
        </div>
        <div className="mt-auto pt-6">
          <div className="h-10 w-full rounded-full bg-muted/70" />
        </div>
      </div>
    );
  }

  // Error State for Dashboard Widget
  if (isActiveError || !challenge) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm">
        <AlertCircle className="h-10 w-10 text-amber-500/80 mb-2" />
        <h3 className="font-display text-base font-semibold">Could not load challenge</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Please check your connection and try again.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetchActive()}
          className="mt-4 rounded-full gap-2 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    );
  }

  const isJoined = Boolean(userParticipation);
  const isCompleted = userParticipation?.status === "completed";

  return (
    <>
      <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-[220ms] hover:shadow-md hover:-translate-y-0.5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Weekly Challenge
          </span>

          {/* Time remaining badge */}
          {!timer.isExpired ? (
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-500 dark:text-amber-400 shrink-0"
            >
              <Clock className="h-3 w-3" />
              {timer.days > 0 ? `${timer.days}D ` : ""}
              {timer.hours}H {timer.minutes}M Left
            </motion.div>
          ) : (
            <div className="inline-flex items-center gap-1 rounded-full border border-muted bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shrink-0">
              Expired
            </div>
          )}
        </div>

        {/* ── Trophy icon + status / participant count ── */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15"
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Trophy className="h-5 w-5 text-amber-500" />
            </motion.div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                This Week's Challenge
              </p>
              {challenge.badge && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500">
                  <Sparkles className="h-2.5 w-2.5" /> {challenge.badge}
                </span>
              )}
            </div>
          </div>

          {/* Participant Count Badge */}
          <div
            title="Active Participants"
            className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-1 text-[11px] font-medium text-secondary-foreground"
          >
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>{challenge.participantCount || 0}</span>
          </div>
        </div>

        {/* ── Title + description ── */}
        <div className="mt-3">
          <h3 className="font-display text-[20px] font-semibold leading-snug tracking-tight">
            {challenge.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {challenge.description}
          </p>
        </div>

        {/* ── Progress Bar (If Joined) ── */}
        {isJoined && userParticipation && (
          <div className="mt-4 rounded-xl border border-border/50 bg-muted/30 p-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-foreground">Your Progress</span>
              <span className="text-primary font-semibold">
                {userParticipation.progress?.percentage || 0}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${userParticipation.progress?.percentage || 0}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  isCompleted
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-amber-500 to-orange-500"
                }`}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {userParticipation.progress?.details ||
                challenge.completionCriteria?.description ||
                "Submit a project to complete the challenge"}
            </p>
          </div>
        )}

        {/* ── Rewards ── */}
        {challenge.rewards && challenge.rewards.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Rewards
            </p>
            <div className="flex flex-wrap gap-2">
              {challenge.rewards.map((reward, i) => {
                const IconComp = getRewardIcon(reward.icon);
                return (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground"
                  >
                    <IconComp className="h-3.5 w-3.5 text-amber-500" />
                    {reward.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CTA Buttons ── */}
        <div className="mt-auto pt-5 space-y-3">
          {isCompleted ? (
            <div className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 🏆 Challenge Completed!
            </div>
          ) : isJoined ? (
            <div className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <LayoutGrid className="h-4 w-4" /> Joined — good luck!
            </div>
          ) : (
            <Button
              onClick={() => handleJoin()}
              disabled={joinMutation.isPending || timer.isExpired}
              className="h-10 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-[0_8px_24px_-8px_rgba(245,158,11,0.5)] transition-all duration-[180ms] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(245,158,11,0.6)] disabled:opacity-50"
            >
              {joinMutation.isPending ? "Joining..." : "Participate Now"}
            </Button>
          )}

          {/* Trigger All Challenges Popup Modal */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex w-full items-center justify-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-70 cursor-pointer"
          >
            View All Challenges <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── All Weekly Challenges Popup Modal Dialog ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-border/80 bg-card shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-widest">
              <Trophy className="h-4 w-4 text-amber-500" /> Weekly Challenge Vault
            </div>
            <DialogTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
              All Weekly Challenges
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Explore active, upcoming, and past builder challenges. Join active challenges directly from this popup.
            </DialogDescription>
          </DialogHeader>

          {/* Filter & Toolbar inside Modal */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              {[
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "upcoming", label: "Upcoming" },
                { id: "expired", label: "Completed/Ended" },
              ].map((tab) => {
                const isActive = modalStatusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setModalStatusFilter(tab.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search & Sort Controls */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-40">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="pl-8 h-7 text-xs rounded-full bg-background"
                />
              </div>

              <select
                value={modalSortBy}
                onChange={(e) => setModalSortBy(e.target.value)}
                className="bg-background border border-border/60 rounded-full px-2.5 py-1 text-xs text-foreground focus:outline-none"
              >
                <option value="endingSoon">Ending Soonest</option>
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Challenges List inside Modal */}
          <div className="mt-4 space-y-4">
            {isModalLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                Loading challenges from database...
              </div>
            ) : modalChallenges.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No challenges match your filters.
              </div>
            ) : (
              modalChallenges.map((ch) => {
                const userPart = ch.userParticipation;
                const chJoined = Boolean(userPart);
                const chCompleted = userPart?.status === "completed";
                const isExp = new Date(ch.endDate).getTime() <= Date.now();
                const isUpc = new Date(ch.startDate).getTime() > Date.now();

                return (
                  <div
                    key={ch._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 p-5 transition-all hover:bg-muted/30"
                  >
                    <div className="space-y-2 max-w-lg">
                      <div className="flex items-center gap-2">
                        {isUpc ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
                            Upcoming
                          </span>
                        ) : isExp ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-muted bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Ended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                            Active
                          </span>
                        )}

                        {!isExp && !isUpc && (
                          <ChallengeCountdownBadge targetDateStr={ch.endDate} />
                        )}

                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          <Users className="h-3 w-3" /> {ch.participantCount || 0} Joined
                        </span>
                      </div>

                      <div>
                        <h4 className="font-display text-base font-bold text-foreground">
                          {ch.title}
                        </h4>
                        {ch.badge && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500">
                            <Sparkles className="h-2.5 w-2.5" /> {ch.badge}
                          </span>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {ch.description}
                        </p>
                      </div>

                      {/* Criteria */}
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Target className="h-3 w-3 text-primary shrink-0" />
                        <span>
                          <strong className="text-foreground">Criteria: </strong>
                          {ch.completionCriteria?.description}
                        </span>
                      </div>

                      {/* Rewards */}
                      {ch.rewards && ch.rewards.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {ch.rewards.map((r, idx) => {
                            const Icon = getRewardIcon(r.icon);
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-2 py-0.5 text-[10px] font-medium text-foreground"
                              >
                                <Icon className="h-3 w-3 text-amber-500" />
                                {r.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Action Column */}
                    <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0 sm:border-l sm:border-border/40 sm:pl-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setLeaderboardModalId(ch._id)}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground self-start sm:self-end"
                      >
                        <ListOrdered className="h-3 w-3 mr-1" /> Leaderboard
                      </Button>

                      {chCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                        </span>
                      ) : chJoined ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                          <UserCheck className="h-3.5 w-3.5" /> Joined
                        </span>
                      ) : isUpc ? (
                        <Button size="sm" disabled className="h-8 rounded-full text-xs">
                          Coming Soon
                        </Button>
                      ) : isExp ? (
                        <Button size="sm" variant="outline" disabled className="h-8 rounded-full text-xs">
                          Ended
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleJoin(ch._id)}
                          disabled={joinMutation.isPending}
                          className="h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white text-xs px-4"
                        >
                          {joinMutation.isPending ? "Joining..." : "Join Challenge"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sub-Dialog for Leaderboard ── */}
      <Dialog
        open={Boolean(leaderboardModalId)}
        onOpenChange={(open) => !open && setLeaderboardModalId(null)}
      >
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold">
              <Trophy className="h-5 w-5 text-amber-500" /> Challenge Leaderboard
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Live builder rankings and progress percentages.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-1">
            {isLeaderboardLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Loading leaderboard...
              </div>
            ) : leaderboardEntries.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No participants yet. Be the first to join!
              </div>
            ) : (
              leaderboardEntries.map((entry, idx) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 grid place-items-center font-bold text-xs text-amber-500">
                      {entry.user?.name ? entry.user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{entry.user?.name || "Anonymous User"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.user?.username ? `@${entry.user.username}` : "Builder"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {entry.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Finished
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-500">
                        {entry.progress?.percentage || 0}% Progress
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
