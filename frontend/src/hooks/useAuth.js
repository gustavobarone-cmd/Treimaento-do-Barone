import { useState, useEffect } from 'react';

const STORAGE_KEY = 'token';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore token from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setToken(stored);
      // Decode JWT to get user info (sub = userId)
      try {
        const payload = JSON.parse(atob(stored.split('.')[1]));
        setUser({
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          studentId: payload.studentId,
        });
      } catch {
        // Invalid token, forget it
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const saveToken = (tokenStr, userData) => {
    localStorage.setItem(STORAGE_KEY, tokenStr);
    setToken(tokenStr);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return { user, token, loading, saveToken, logout };
}
