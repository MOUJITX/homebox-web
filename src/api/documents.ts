import axios from "./axios";
import type { DocumentAttachment } from "./documentAttachments";

export type DocumentStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "LOST";
export type Importance = "HIGH" | "MEDIUM" | "LOW";

export interface Document {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  parentId: number | null;
  parentName: string | null;
  holder: string | null;
  documentNumber: string | null;
  issuer: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: DocumentStatus;
  importance: Importance;
  reminderDays: number;
  note: string | null;
  subDocumentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetail extends Document {
  attachments: DocumentAttachment[];
  invoices: BoundDocumentInvoice[];
  subDocuments: Document[];
}

export interface BoundDocumentInvoice {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: string;
  totalAmount: number;
  sellerName: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface GetDocumentsParams {
  search?: string;
  categoryId?: number;
  status?: DocumentStatus;
  importance?: Importance;
  parentId?: number | null;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface CreateDocumentRequest {
  name: string;
  categoryId: number;
  parentId?: number;
  holder?: string;
  documentNumber?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  status?: DocumentStatus;
  importance?: Importance;
  reminderDays?: number;
  note?: string;
}

export interface UpdateDocumentRequest {
  name?: string;
  categoryId?: number;
  holder?: string;
  documentNumber?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  status?: DocumentStatus;
  importance?: Importance;
  reminderDays?: number;
  note?: string;
}

export const getDocuments = (params: GetDocumentsParams = {}) =>
  axios.get<Page<Document>>("/documents", { params });

export const getDocumentById = (id: number) =>
  axios.get<DocumentDetail>(`/documents/${id}`);

export const createDocument = (data: CreateDocumentRequest) =>
  axios.post<DocumentDetail>("/documents", data);

export const updateDocument = (id: number, data: UpdateDocumentRequest) =>
  axios.put<DocumentDetail>(`/documents/${id}`, data);

export const deleteDocument = (id: number) =>
  axios.delete<void>(`/documents/${id}`);

export const bindDocumentInvoice = (documentId: number, invoiceId: number) =>
  axios.post<void>(`/documents/${documentId}/invoices/${invoiceId}`);

export const unbindDocumentInvoice = (
  documentId: number,
  invoiceId: number,
) => axios.delete<void>(`/documents/${documentId}/invoices/${invoiceId}`);
