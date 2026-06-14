import axios from "./axios";

export interface DocumentAttachment {
  id: number;
  fileId: number;
  filename: string;
  contentType: string;
  fileSize: number;
  url: string;
  createdAt: string;
  indexed: boolean;
}

export const getDocumentAttachments = (documentId: number) =>
  axios.get<DocumentAttachment[]>(`/documents/${documentId}/attachments`);

export const uploadDocumentAttachment = (
  documentId: number,
  file?: File,
  fileId?: number,
) => {
  if (fileId != null) {
    return axios.post<DocumentAttachment>(
      `/documents/${documentId}/attachments?fileId=${fileId}`,
    );
  }
  const formData = new FormData();
  formData.append("file", file!);
  return axios.post<DocumentAttachment>(
    `/documents/${documentId}/attachments`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
};

export const deleteDocumentAttachment = (
  documentId: number,
  attachmentId: number,
) =>
  axios.delete<void>(
    `/documents/${documentId}/attachments/${attachmentId}`,
  );
