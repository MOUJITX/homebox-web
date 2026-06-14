import axios from "./axios";

export interface DocumentCategory {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateDocumentCategoryRequest {
  name?: string;
  description?: string;
}

export const getDocumentCategories = () =>
  axios.get<DocumentCategory[]>("/document-categories");

export const createDocumentCategory = (
  data: CreateDocumentCategoryRequest,
) => axios.post<DocumentCategory>("/document-categories", data);

export const updateDocumentCategory = (
  id: number,
  data: UpdateDocumentCategoryRequest,
) => axios.put<DocumentCategory>(`/document-categories/${id}`, data);

export const deleteDocumentCategory = (id: number) =>
  axios.delete<void>(`/document-categories/${id}`);
