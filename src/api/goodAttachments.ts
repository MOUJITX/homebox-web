import axios from "./axios";

export interface GoodAttachment {
  id: number;
  filename: string;
  contentType: string;
  fileSize: number;
  url: string;
  createdAt: string;
  indexed: boolean;
}

export const getGoodAttachments = (goodId: number) =>
  axios.get<GoodAttachment[]>(`/goods/${goodId}/attachments`);

export const uploadGoodAttachment = (goodId: number, file?: File, fileId?: number) => {
  if (fileId != null) {
    return axios.post<GoodAttachment>(`/goods/${goodId}/attachments?fileId=${fileId}`);
  }
  const formData = new FormData();
  formData.append("file", file!);
  return axios.post<GoodAttachment>(`/goods/${goodId}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteGoodAttachment = (goodId: number, attachmentId: number) =>
  axios.delete<void>(`/goods/${goodId}/attachments/${attachmentId}`);
