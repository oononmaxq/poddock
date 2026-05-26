import { useCallback, useEffect, useState } from 'preact/hooks';

export interface PaginatedFetchResult<T> {
  items: T[];
  hasMore: boolean;
}

interface UsePaginatedListOptions<T> {
  pageSize: number;
  fetchPage: (offset: number, limit: number) => Promise<PaginatedFetchResult<T>>;
}

export function usePaginatedList<T>({ pageSize, fetchPage }: UsePaginatedListOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const loadInitial = useCallback(async () => {
    setLoadingInitial(true);
    try {
      const result = await fetchPage(0, pageSize);
      setItems(result.items);
      setHasMore(result.hasMore);
    } finally {
      setLoadingInitial(false);
    }
  }, [fetchPage, pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchPage(items.length, pageSize);
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, items.length, loadingMore, pageSize]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return {
    items,
    hasMore,
    loadingInitial,
    loadingMore,
    loadMore,
    reload: loadInitial,
  };
}
