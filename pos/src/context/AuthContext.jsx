import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [worker, setWorker] = useState(() => {
    const w = sessionStorage.getItem('pos_worker');
    return w ? JSON.parse(w) : null;
  });

  const login = async (code) => {
    const { data } = await api.post('/auth/worker/login', { code });
    sessionStorage.setItem('pos_token', data.token);
    sessionStorage.setItem('pos_worker', JSON.stringify(data.worker));
    sessionStorage.setItem('pos_sessionId', data.sessionId);
    setWorker(data.worker);
    return data.worker;
  };

  const logout = async () => {
    try { await api.post('/auth/worker/logout'); } catch {}
    sessionStorage.clear();
    setWorker(null);
  };

  return (
    <AuthContext.Provider value={{ worker, login, logout, isAuthenticated: !!worker }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
