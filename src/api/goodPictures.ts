import axios from "./axios";
import type { GoodPicture } from "./goods";

export const uploadGoodPicture = (goodId: number, file?: File, fileId?: number) => {
  if (fileId != null) {
    return axios.post<GoodPicture>(`/goods/${goodId}/pictures?fileId=${fileId}`);
  }
  const formData = new FormData();
  formData.append("file", file!);
  return axios.post<GoodPicture>(`/goods/${goodId}/pictures`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteGoodPicture = (goodId: number, pictureId: number) =>
  axios.delete<void>(`/goods/${goodId}/pictures/${pictureId}`);
