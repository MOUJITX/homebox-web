import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import {
  getToken,
  setToken as persistToken,
  clearToken,
  setSessionExpiredHandler,
} from "@/api/axios";
import { AuthContext } from "./authContextValue";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(getToken);
  const [sessionExpired, setSessionExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setToken(null);
      setSessionExpired(true);
    });
    return () => {
      setSessionExpiredHandler(null);
    };
  }, []);

  const login = useCallback((newToken: string) => {
    persistToken(newToken);
    setToken(newToken);
  }, []);

  const clearSession = useCallback(() => {
    clearToken();
    setToken(null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    navigate("/login", { replace: true });
  }, [clearSession, navigate]);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      token,
      sessionExpired,
      login,
      logout,
      clearSession,
      dismissSessionExpired,
    }),
    [token, sessionExpired, login, logout, clearSession, dismissSessionExpired],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
