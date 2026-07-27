import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFeed, fetchMyDrafts, likeDraft, bookmarkDraft, type Draft } from "@/lib/api";

export type FeedFilters = {
  search?: string;
  category?: string;
  techStack?: string[];
  stage?: string[];
  status?: string;
  openForRevival?: boolean;
  sort?: string;
};

export type FeedPage = {
  data: Draft[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
};

export function useDrafts(filters?: FeedFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["feed", filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchFeed({ ...filters, page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled,
  });
}

export function useMyDrafts() {
  return useQuery({ queryKey: ["my-drafts"], queryFn: fetchMyDrafts });
}

// Mutations with automatic cache updates and invalidation
export function useLikeDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: likeDraft,
    onSuccess: (updatedDraft) => {
      // Update the specific draft in all feed queries
      queryClient.setQueryData(["feed"], (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((d: any) => 
              d._id === updatedDraft._id ? updatedDraft : d
            )
          }))
        };
      });
      // Invalidate to trigger refetch and sync across tabs
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error) => {
      console.error("Failed to like draft:", error);
    }
  });
}

export function useBookmarkDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookmarkDraft,
    onSuccess: (updatedDraft) => {
      // Update the specific draft in all feed queries
      queryClient.setQueryData(["feed"], (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((d: any) => 
              d._id === updatedDraft._id ? updatedDraft : d
            )
          }))
        };
      });
      // Invalidate to trigger refetch and sync across tabs
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error) => {
      console.error("Failed to bookmark draft:", error);
    }
  });
}