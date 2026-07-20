import { useQuery } from "@tanstack/react-query";
import { fetchFeed } from "@/lib/api";

export function useDrafts() {
  return useQuery({ queryKey: ["feed"], queryFn: fetchFeed });
}