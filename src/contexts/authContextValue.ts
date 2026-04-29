import { createContext } from "react";

export interface AuthContextValue {
  token: string | null;
  sessionExpired: boolean;
  login: (token: string) => void;
  logout: () => void;
  clearSession: () => void;
  dismissSessionExpired: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
