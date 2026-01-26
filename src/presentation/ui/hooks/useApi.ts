import { useState, useEffect, useCallback } from 'preact/hooks';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(url: string) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(url, {
        credentials: 'include', // Send cookies
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        throw new Error('API request failed');
      }

      const data = await response.json();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [url]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login';
    }
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login';
    }
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export async function apiDelete(url: string): Promise<void> {
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login';
    }
    throw new Error('Delete failed');
  }
}
