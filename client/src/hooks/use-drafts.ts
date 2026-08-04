import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchFeed,
  fetchMyDrafts,
  fetchFilteredFeed,
  fetchTrendingFeed,
  likeDraft,
  bookmarkDraft,
  type Draft,
  type FeedFilters,
} from "@/lib/api";

export type { FeedFilters };

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

export function useFilteredFeed(filters: FeedFilters) {
  return useQuery({
    queryKey: ["filtered-feed", filters],
    queryFn: () => fetchFilteredFeed(filters),
  });
}

export function useTrendingFeed() {
  return useQuery({
    queryKey: ["trending-feed"],
    queryFn: fetchTrendingFeed,
  });
}

export function useDrafts(filters?: FeedFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["feed", filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchFeed({ ...filters, page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.page + 1
        : undefined,
    initialPageParam: 1,
    enabled,
  });
}

export function useMyDrafts() {
  return useQuery({
    queryKey: ["my-drafts"],
    queryFn: fetchMyDrafts,
  });
}

// Mutations with automatic cache updates and invalidation
export function useLikeDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: likeDraft,
    onSuccess: (updatedDraft) => {
      queryClient.setQueryData(["feed"], (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((d: any) =>
              d._id === updatedDraft._id ? updatedDraft : d
            ),
          })),
        };
      });

      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error) => {
      console.error("Failed to like draft:", error);
    },
  });
}

export function useBookmarkDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookmarkDraft,
    onSuccess: (updatedDraft) => {
      // Update feed cache
      queryClient.setQueryData(["feed"], (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((d: any) =>
              d._id === updatedDraft._id ? updatedDraft : d
            ),
          })),
        };
      });

      // Update my-drafts cache - preserve original structure and only update bookmarked field
      queryClient.setQueryData(["my-drafts"], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        
        return oldData.map((d: any) => {
          if (d._id === updatedDraft._id) {
            // Preserve the original draft structure (isOwner, userRole, _sharedRole, etc)
            // and only update the bookmarked and bookmark count fields
            return {
              ...d,
              bookmarked: updatedDraft.bookmarked,
              bookmarks: updatedDraft.bookmarks,
              bookmarkedBy: updatedDraft.bookmarkedBy
            };
          }
          return d;
        });
      });

      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-drafts"] });
    },
    onError: (error) => {
      console.error("Failed to bookmark draft:", error);
    },
  });
}