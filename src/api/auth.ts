import axios from "./axios";

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  expiresIn: number;
  forceChangePassword: boolean;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

export const login = (data: LoginRequest) =>
  axios.post<LoginResponse>("/auth/login", { ...data, clientType: "client" });

export const changePassword = (data: ChangePasswordRequest) =>
  axios.post<ChangePasswordResponse>("/auth/change-password", data);
