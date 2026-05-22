import axios from "./axios";

export interface Platform {
  id: number;
  name: string;
  logoUrl: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformRequest {
  name: string;
  logoFileId?: number;
  website?: string;
}

export const getPlatforms = () =>
  axios.get<Platform[]>("/platforms");

export const createPlatform = (data: PlatformRequest) =>
  axios.post<Platform>("/platforms", data);

export const updatePlatform = (id: number, data: PlatformRequest) =>
  axios.put<Platform>(`/platforms/${id}`, data);

export const deletePlatform = (id: number) =>
  axios.delete<void>(`/platforms/${id}`);
