import axios from "./axios";
import type { Page } from "./goods";

export type ProcessStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";

export interface FileRecord {
  id: number;
  storedFilename: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  url: string;
  createdAt: string;
  extractStatus: ProcessStatus;
  chunkStatus: ProcessStatus;
}

export const getFiles = (
  page = 0,
  size = 20,
  filters?: { search?: string; contentType?: string; status?: string },
) =>
  axios.get<Page<FileRecord>>("/files", {
    params: {
      page,
      size,
      ...(filters?.search ? { search: filters.search } : {}),
      ...(filters?.contentType ? { contentType: filters.contentType } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    },
  });

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

export const retryFile = (id: number) => axios.post<void>(`/files/${id}/retry`);
