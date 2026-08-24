import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  function clearSession() {
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    async function boot() {
      if (!getToken()) {
        setReady(true);
        return;
      }
      try {
        const data = await api('/auth/me');
        setUser(data.user);
      } catch {
        clearSession();
      } finally {
        setReady(true);
      }
    }
    boot();
  }, []);

  useEffect(() => {
    function onEnded() {
      clearSession();
    }
    window.addEventListener('tokenflow-session-ended', onEnded);
    const timer = setInterval(() => {
      if (!getToken()) return;
      api('/auth/me').then((data) => setUser(data.user)).catch(() => clearSession());
    }, 20000);
    return () => {
      window.removeEventListener('tokenflow-session-ended', onEnded);
      clearInterval(timer);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      async login(username, password) {
        const data = await api('/auth/login', { method: 'POST', body: { username, password } });
        setToken(data.token);
        setUser(data.user);
      },
      async logout() {
        try {
          if (getToken()) await api('/auth/logout', { method: 'POST' });
        } catch {
          /* local sign-out still proceeds */
        }
        clearSession();
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
