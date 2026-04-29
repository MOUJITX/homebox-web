import axios from "./axios";

export interface Profile {
  id: number;
  username: string;
  displayName: string;
  roleName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  displayName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const getProfile = () => axios.get<Profile>("/profile");

export const updateProfile = (data: UpdateProfileRequest) =>
  axios.put<Profile>("/profile", data);

export const changeProfilePassword = (data: ChangePasswordRequest) =>
  axios.put<{ message: string }>("/profile/password", data);
