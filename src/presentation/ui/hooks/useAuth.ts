// Authentication hook
export function useAuth() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const logout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return { token, logout };
}

export function getAuthHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
