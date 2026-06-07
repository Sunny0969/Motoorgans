import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  changePassword as changePasswordStore,
  getLoginTime,
  getStoredUser,
  isAuthenticated as checkAuth,
  login as loginStore,
  logout as logoutStore,
} from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(checkAuth());
  const [user, setUser] = useState(getStoredUser());
  const [loginTime, setLoginTime] = useState(getLoginTime());

  const refresh = useCallback(() => {
    setAuthed(checkAuth());
    setUser(getStoredUser());
    setLoginTime(getLoginTime());
  }, []);

  const login = useCallback((username, password) => {
    const result = loginStore(username, password);
    if (result.ok) {
      refresh();
    }
    return result;
  }, [refresh]);

  const logout = useCallback(() => {
    logoutStore();
    refresh();
  }, [refresh]);

  const changePassword = useCallback((currentPassword, newPassword) => {
    const result = changePasswordStore(currentPassword, newPassword);
    return result;
  }, []);

  const value = useMemo(() => ({
    isAuthenticated: authed,
    user,
    loginTime,
    login,
    logout,
    changePassword,
    refresh,
  }), [authed, user, loginTime, login, logout, changePassword, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
