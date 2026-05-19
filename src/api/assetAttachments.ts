import axios from "./axios";

export interface AssetAttachment {
  id: number;
  filename: string;
  contentType: string;
  fileSize: number;
  url: string;
  createdAt: string;
  indexed: boolean;
}

export const getAssetAttachments = (assetId: number) =>
  axios.get<AssetAttachment[]>(`/assets/${assetId}/attachments`);

export const uploadAssetAttachment = (assetId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post<AssetAttachment>(
    `/assets/${assetId}/attachments`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
};

export const deleteAssetAttachment = (
  assetId: number,
  attachmentId: number,
) => axios.delete<void>(`/assets/${assetId}/attachments/${attachmentId}`);
