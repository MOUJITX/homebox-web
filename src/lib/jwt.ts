import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
};
