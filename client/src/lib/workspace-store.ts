/**
 * Workspace management using MongoDB backend.
 * All workspace data is stored in the database and accessed via the Workspace API.
 */

export type WorkspaceTask = {
  id: string;
  title: string;
  status: "Todo" | "In Progress" | "Done";
  priority: "High" | "Medium" | "Low";
  assignee: string;
};

export type WorkspaceMilestone = {
  id: string;
  label: string;
  progress: number;
};

export type { WorkspaceData } from "@/lib/api";
