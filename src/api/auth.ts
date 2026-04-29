import axios from "./axios";

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
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
  axios.post<LoginResponse>("/api/auth/login", data);

export const changePassword = (data: ChangePasswordRequest) =>
  axios.post<ChangePasswordResponse>("/api/auth/change-password", data);
