import axios from "./axios";
import type { Page } from "./goods";

export interface FileRecord {
  id: number;
  storedFilename: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export const getFiles = (page = 0, size = 20) =>
  axios.get<Page<FileRecord>>("/files", { params: { page, size } });

export const getFileById = (id: number) =>
  axios.get<FileRecord>(`/files/${id}`);

export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post<FileRecord>("/files", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const renameFile = (id: number, originalFilename: string) =>
  axios.patch<FileRecord>(`/files/${id}/rename`, { originalFilename });

export const deleteFile = (id: number) => axios.delete<void>(`/files/${id}`);
