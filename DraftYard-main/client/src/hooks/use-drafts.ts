import { useQuery } from "@tanstack/react-query";
import { fetchFeed, fetchMyDrafts } from "@/lib/api";

export function useDrafts() {
  return useQuery({ queryKey: ["feed"], queryFn: fetchFeed });
}

export function useMyDrafts() {
  return useQuery({ queryKey: ["my-drafts"], queryFn: fetchMyDrafts });
}