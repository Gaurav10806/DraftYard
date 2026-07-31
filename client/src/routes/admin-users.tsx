import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Eye,
  FileText,
  Filter,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  Users,
  Unlock,
  RefreshCw,
  Info,
} from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import {
  fetchAdminUsers,
  fetchUserDraftsAdmin,
  warnUserAdmin,
  deleteDraftAdmin,
  blockUserAdmin,
  fetchBlockedEmails,
  unblockEmailAdmin,
  type AdminUser,
  type BlockedEmailRecord,
  type Draft,
} from "@/lib/api";

export const Route = createFileRoute("/admin-users")({
  head: () => ({
    meta: [
      { title: "User Moderation · DraftYard Admin" },
      { name: "description", content: "Admin user management, warning, draft removal, and email blocking." },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin" || user?.email?.toLowerCase() === "draftadmin@gmail.com";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [blockedEmails, setBlockedEmails] = useState<BlockedEmailRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "blocked">("users");

  // Dialog States
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // Warn Modal
  const [warnModalOpen, setWarnModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isSubmittingWarn, setIsSubmittingWarn] = useState(false);

  // Inspect Drafts Modal
  const [draftsModalOpen, setDraftsModalOpen] = useState(false);
  const [userDrafts, setUserDrafts] = useState<Draft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);

  // Delete Draft Modal
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null);
  const [draftDeleteReason, setDraftDeleteReason] = useState("");
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);

  // Block & Delete Account Modal
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [isBlockingUser, setIsBlockingUser] = useState(false);

  // Unblock Email Modal
  const [unblockTarget, setUnblockTarget] = useState<BlockedEmailRecord | null>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      navigate({ to: "/feed" });
    }
  }, [authLoading, isAdmin, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [userData, blockedData] = await Promise.all([
        fetchAdminUsers(),
        fetchBlockedEmails(),
      ]);
      setUsers(userData);
      setBlockedEmails(blockedData);
    } catch (err: any) {
      toast.error(err.message || "Failed to load moderation data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const filteredUsers = users.filter((u) => {
    // Exclude administrator accounts from User Handling list
    if (u.role === "admin" || u.email.toLowerCase() === "draftadmin@gmail.com") {
      return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  // Action: Open Drafts Modal
  const handleOpenDraftsModal = async (u: AdminUser) => {
    setSelectedUser(u);
    setDraftsModalOpen(true);
    try {
      setIsLoadingDrafts(true);
      const userIdOrEmail = u._id || (u as any).id || u.email;
      const drafts = await fetchUserDraftsAdmin(userIdOrEmail);
      setUserDrafts(drafts);
    } catch (err: any) {
      toast.error(err.message || "Failed to load user drafts");
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  // Action: Send Warning
  const handleSendWarning = async () => {
    if (!selectedUser || !warningMessage.trim()) return;
    try {
      setIsSubmittingWarn(true);
      await warnUserAdmin(selectedUser._id, warningMessage.trim());
      toast.success(`Warning notification sent to ${selectedUser.name}!`);
      setWarnModalOpen(false);
      setWarningMessage("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to send warning");
    } finally {
      setIsSubmittingWarn(false);
    }
  };

  // Action: Delete Specific Draft
  const handleDeleteDraft = async () => {
    if (!draftToDelete || !draftDeleteReason.trim()) return;
    try {
      setIsDeletingDraft(true);
      await deleteDraftAdmin(draftToDelete._id || draftToDelete.id!, draftDeleteReason.trim());
      toast.success(`Draft "${draftToDelete.projectName}" deleted!`);
      setUserDrafts((prev) => prev.filter((d) => (d._id || d.id) !== (draftToDelete._id || draftToDelete.id)));
      setDraftToDelete(null);
      setDraftDeleteReason("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete draft");
    } finally {
      setIsDeletingDraft(false);
    }
  };

  // Action: Block & Delete User Account
  const handleBlockUser = async () => {
    if (!selectedUser || !blockReason.trim()) return;
    try {
      setIsBlockingUser(true);
      await blockUserAdmin(selectedUser._id, blockReason.trim());
      toast.success(`User ${selectedUser.email} deleted and email permanently blacklisted!`);
      setBlockModalOpen(false);
      setBlockReason("");
      setSelectedUser(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to block user");
    } finally {
      setIsBlockingUser(false);
    }
  };

  // Action: Unblock Email
  const handleUnblockEmail = async () => {
    if (!unblockTarget) return;
    try {
      setIsUnblocking(true);
      await unblockEmailAdmin(unblockTarget._id);
      toast.success(`Email ${unblockTarget.email} unblocked!`);
      setUnblockTarget(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to unblock email");
    } finally {
      setIsUnblocking(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground dark:bg-[#0d0d14]">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col dark:bg-[#0d0d14]">
          <TopBar showGreeting={false} />

          <motion.main
            className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                  <ShieldAlert className="h-7 w-7 text-amber-500" />
                  User Handling & Moderation
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Inspect users, review reported drafts, send formal warning notifications, or permanently ban malicious accounts.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                className="self-start sm:self-auto gap-2 rounded-full"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm dark:border-[#2a2a3d] dark:bg-[#13131f]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Total Accounts</span>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 font-display text-2xl font-bold">{users.length}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Registered users on platform</div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm dark:border-[#2a2a3d] dark:bg-[#13131f]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Warnings Issued</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-2 font-display text-2xl font-bold text-amber-500">
                  {users.reduce((sum, u) => sum + (u.warningCount || 0), 0)}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">Formal warning notifications delivered</div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm dark:border-[#2a2a3d] dark:bg-[#13131f]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Blacklisted Emails</span>
                  <Ban className="h-4 w-4 text-red-500" />
                </div>
                <div className="mt-2 font-display text-2xl font-bold text-red-500">{blockedEmails.length}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Permanently blocked registration emails</div>
              </div>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="users" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-3">
                <TabsList className="rounded-full bg-muted/60 p-1">
                  <TabsTrigger value="users" className="rounded-full text-xs font-medium gap-1.5 px-4">
                    <Users className="h-3.5 w-3.5" /> User Accounts ({users.length})
                  </TabsTrigger>
                  <TabsTrigger value="blocked" className="rounded-full text-xs font-medium gap-1.5 px-4">
                    <Ban className="h-3.5 w-3.5 text-red-500" /> Blocked Email Registry ({blockedEmails.length})
                  </TabsTrigger>
                </TabsList>

                {activeTab === "users" && (
                  <div className="relative w-full max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users by name, email..."
                      className="h-8 rounded-full bg-card pl-8 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Users Tab Content */}
              <TabsContent value="users" className="mt-4">
                {isLoading ? (
                  <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading user management data...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground border border-dashed border-border/60 rounded-2xl p-8">
                    No matching users found.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm dark:border-[#2a2a3d] dark:bg-[#13131f]">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3.5 px-4">User</th>
                          <th className="py-3.5 px-4">Role</th>
                          <th className="py-3.5 px-4">Drafts</th>
                          <th className="py-3.5 px-4">Warnings</th>
                          <th className="py-3.5 px-4">Joined</th>
                          <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredUsers.map((u) => {
                          const isSelfOrAdmin = u.role === "admin" || u.email.toLowerCase() === "draftadmin@gmail.com";
                          return (
                            <tr key={u._id} className="transition-colors hover:bg-muted/20">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 ring-1 ring-border">
                                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                      {getInitials(u.name || u.fullName, u.email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-foreground truncate">{u.name || u.fullName}</div>
                                    <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                {isSelfOrAdmin ? (
                                  <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30">
                                    Admin
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    User
                                  </Badge>
                                )}
                              </td>

                              <td className="py-3 px-4 font-medium">{u.draftCount || 0}</td>

                              <td className="py-3 px-4">
                                {u.warningCount > 0 ? (
                                  <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                                    {u.warningCount} warning{u.warningCount > 1 ? "s" : ""}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">0</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-muted-foreground">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Inspect Drafts */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenDraftsModal(u)}
                                    className="h-7 gap-1 rounded-full text-[11px]"
                                    title="View all drafts created by this user"
                                  >
                                    <Eye className="h-3 w-3" /> Drafts ({u.draftCount})
                                  </Button>

                                  {!isSelfOrAdmin && (
                                    <>
                                      {/* Send Warning */}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedUser(u);
                                          setWarnModalOpen(true);
                                        }}
                                        className="h-7 gap-1 rounded-full text-[11px] border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                                      >
                                        <AlertTriangle className="h-3 w-3" /> Warn User
                                      </Button>

                                      {/* Block & Delete User Account */}
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                          setSelectedUser(u);
                                          setBlockModalOpen(true);
                                        }}
                                        className="h-7 gap-1 rounded-full text-[11px]"
                                      >
                                        <UserX className="h-3 w-3" /> Block & Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* Blocked Email Registry Tab Content */}
              <TabsContent value="blocked" className="mt-4">
                {blockedEmails.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground border border-dashed border-border/60 rounded-2xl p-8">
                    No emails are currently blacklisted.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm dark:border-[#2a2a3d] dark:bg-[#13131f]">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3.5 px-4">Blacklisted Email</th>
                          <th className="py-3.5 px-4">Reason Message</th>
                          <th className="py-3.5 px-4">Blocked By</th>
                          <th className="py-3.5 px-4">Blocked On</th>
                          <th className="py-3.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {blockedEmails.map((b) => (
                          <tr key={b._id} className="transition-colors hover:bg-muted/20">
                            <td className="py-3 px-4 font-semibold text-red-500 font-mono text-xs">{b.email}</td>
                            <td className="py-3 px-4 text-muted-foreground max-w-md truncate">{b.reason}</td>
                            <td className="py-3 px-4 text-muted-foreground">{b.blockedBy?.name || "Admin"}</td>
                            <td className="py-3 px-4 text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setUnblockTarget(b)}
                                className="h-7 gap-1 rounded-full text-[11px] border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                              >
                                <Unlock className="h-3 w-3" /> Unblock Email
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.main>
        </SidebarInset>
      </div>

      {/* MODAL 1: Send Warning Notification */}
      <Dialog open={warnModalOpen} onOpenChange={setWarnModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" /> Send Warning Notification
            </DialogTitle>
            <DialogDescription>
              This message will be delivered directly to <strong>{selectedUser?.name}</strong>'s in-app notification box.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="text-xs font-medium text-muted-foreground">
              Recipient: <span className="text-foreground font-semibold">{selectedUser?.email}</span>
            </div>
            <Textarea
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              placeholder="Specify the reason or policy violation warning message..."
              rows={4}
              className="text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setWarnModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendWarning}
              disabled={isSubmittingWarn || !warningMessage.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-full"
            >
              {isSubmittingWarn ? "Sending..." : "Send Warning"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Inspect User Drafts */}
      <Dialog open={draftsModalOpen} onOpenChange={setDraftsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Drafts by {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Review all drafts submitted by {selectedUser?.email}. You can delete individual drafts with a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {isLoadingDrafts ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading drafts...</div>
            ) : userDrafts.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
                This user has not submitted any drafts yet.
              </div>
            ) : (
              <div className="space-y-2">
                {userDrafts.map((d) => (
                  <div
                    key={d._id || d.id}
                    className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border/60 bg-muted/20"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm leading-tight text-foreground">{d.projectName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{d.oneLiner}</div>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] py-0">{d.currentStage}</Badge>
                        <span>{(d.views || 0)} views</span>
                        <span>{(d.likes || 0)} likes</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDraftToDelete(d)}
                      className="h-8 gap-1 rounded-full text-xs shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Draft
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDraftsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Delete Specific Draft with Reason */}
      <Dialog open={draftToDelete !== null} onOpenChange={(o) => !o && setDraftToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" /> Delete Draft "{draftToDelete?.projectName}"
            </DialogTitle>
            <DialogDescription>
              Please specify the reason for removing this draft. An automatic notification will be sent to the owner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              value={draftDeleteReason}
              onChange={(e) => setDraftDeleteReason(e.target.value)}
              placeholder="Reason message for removing this draft..."
              rows={3}
              className="text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setDraftToDelete(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteDraft}
              disabled={isDeletingDraft || !draftDeleteReason.trim()}
              className="rounded-full"
            >
              {isDeletingDraft ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: Block & Delete User Account */}
      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <UserX className="h-5 w-5" /> Block Email & Delete Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.name}</strong> ({selectedUser?.email})? This will purge all their drafts and permanently blacklist their email address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="text-xs font-medium text-red-500 flex items-center gap-1.5">
              <Info className="h-4 w-4" /> This action cannot be undone.
            </div>
            <Textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="State reason for blocking this user account..."
              rows={3}
              className="text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setBlockModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBlockUser}
              disabled={isBlockingUser || !blockReason.trim()}
              className="rounded-full"
            >
              {isBlockingUser ? "Blocking User..." : "Confirm Block & Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: Unblock Email Confirmation */}
      <Dialog open={unblockTarget !== null} onOpenChange={(o) => !o && setUnblockTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-500">
              <Unlock className="h-5 w-5" /> Unblock Email Address
            </DialogTitle>
            <DialogDescription>
              Unblocking <strong>{unblockTarget?.email}</strong> will allow this email address to register a new account on DraftYard again.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setUnblockTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUnblockEmail}
              disabled={isUnblocking}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
            >
              {isUnblocking ? "Unblocking..." : "Confirm Unblock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
