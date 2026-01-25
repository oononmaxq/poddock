import { useState, useEffect, useCallback } from 'preact/hooks';
import { getAuthHeaders } from './useAuth';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(url: string, token: string | null) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    // トークンがない場合は即座にログイン画面へ
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(url, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('access_token');
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
  }, [url, token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}

export async function apiPost<T>(url: string, token: string | null, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export async function apiPatch<T>(url: string, token: string | null, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export async function apiDelete(url: string, token: string | null): Promise<void> {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    throw new Error('Delete failed');
  }
}
