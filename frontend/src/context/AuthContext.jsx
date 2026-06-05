import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('hermes_token');
    const user = localStorage.getItem('hermes_user');
    return token ? { token, user: JSON.parse(user) } : null;
  });

  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('hermes_token', data.token);
    localStorage.setItem('hermes_user', JSON.stringify({ username: data.username, role: data.role }));
    setAuth({ token: data.token, user: { username: data.username, role: data.role } });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hermes_token');
    localStorage.removeItem('hermes_user');
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
