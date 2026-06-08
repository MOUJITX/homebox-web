import axios from "./axios";
import type { AssetPicture } from "./assets";

export const uploadAssetPicture = (assetId: number, file?: File, fileId?: number) => {
  if (fileId != null) {
    return axios.post<AssetPicture>(`/assets/${assetId}/pictures?fileId=${fileId}`);
  }
  const formData = new FormData();
  formData.append("file", file!);
  return axios.post<AssetPicture>(`/assets/${assetId}/pictures`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteAssetPicture = (assetId: number, pictureId: number) =>
  axios.delete<void>(`/assets/${assetId}/pictures/${pictureId}`);
