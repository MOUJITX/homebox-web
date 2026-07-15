import axios from "./axios";
import type { BookPicture } from "./books";

export const uploadBookPicture = (
  bookId: number,
  file?: File,
  fileId?: number,
) => {
  if (fileId != null) {
    return axios.post<BookPicture>(
      `/books/${bookId}/pictures?fileId=${fileId}`,
    );
  }
  const formData = new FormData();
  formData.append("file", file!);
  return axios.post<BookPicture>(`/books/${bookId}/pictures`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteBookPicture = (bookId: number, pictureId: number) =>
  axios.delete<void>(`/books/${bookId}/pictures/${pictureId}`);
