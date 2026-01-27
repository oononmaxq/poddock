// Authentication hook - now uses HttpOnly cookies
export function useAuth() {
  // Token is stored in HttpOnly cookie, not accessible from JS
  // We track authentication state based on API responses

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore errors, redirect anyway
    }
    window.location.href = '/login';
  };

  return { logout };
}

// No longer needed - cookies are sent automatically
export function getAuthHeaders() {
  return {};
}
