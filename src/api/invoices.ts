import axios from "./axios";

import type { VisitSourceType } from "./medical";

export type InvoiceType =
  | "DIGITAL_INVOICE"
  | "RAILWAY_ELECTRONIC"
  | "VAT_INVOICE"
  | "AIR_ELECTRONIC"
  | "GENERAL_MACHINE_PRINTED"
  | "QUOTA_INVOICE"
  | "NON_TAX_INCOME_GENERAL"
  | "NON_TAX_INCOME_UNIFIED"
  | "FUND_SETTLEMENT"
  | "MEDICAL_OUTPATIENT"
  | "MEDICAL_INPATIENT"
  | "OTHER";

export type InvoiceStatus = "NORMAL" | "VOIDED" | "RED_FLUSHED";

export interface Invoice {
  id: number;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  invoiceType: InvoiceType;
  invoiceStatus: InvoiceStatus;
  sellerName: string | null;
  buyerName: string | null;
  amount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  attachmentCount: number;
  assets: BoundAsset[];
  subscriptions: BoundSubscription[];
  visits: BoundVisitRecord[];
  documents: BoundDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDetail extends Invoice {
  sellerTaxId: string | null;
  buyerTaxId: string | null;
  remark: string | null;
  fileId: number | null;
  fileUrl: string | null;
  fileOriginalFilename: string | null;
  fileSize: number | null;
  previewImage: string | null;
  attachments: InvoiceAttachment[];
}

export interface InvoiceAttachment {
  id: number;
  fileId: number;
  filename: string;
  contentType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export interface BoundAsset {
  id: number;
  assetId: number;
  name: string;
  barcode: string | null;
  firstPictureUrl: string | null;
}

export interface BoundSubscription {
  id: number;
  subscriptionId: number;
  subscriptionName: string;
  platformId: number;
  platformName: string;
  platformLogoUrl: string | null;
}

export interface BoundVisitRecord {
  id: number;
  visitId: number;
  patientName: string;
  sourceType: VisitSourceType;
  sourceId: number;
}

export interface BoundDocument {
  id: number;
  documentId: number;
  documentName: string;
  categoryId: number;
  categoryName: string;
}

export interface InvoiceParseResult {
  invoiceNumber: string | null;
  invoiceDate: string | null;
  invoiceType: InvoiceType | null;
  invoiceStatus: InvoiceStatus | null;
  sellerName: string | null;
  sellerTaxId: string | null;
  buyerName: string | null;
  buyerTaxId: string | null;
  amount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  remark: string | null;
  fileId: number | null;
  previewImage: string | null;
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

export interface GetInvoicesParams {
  search?: string;
  invoiceType?: InvoiceType;
  invoiceStatus?: InvoiceStatus;
  buyerName?: string;
  sellerName?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface CreateInvoiceRequest {
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceType: InvoiceType;
  invoiceStatus?: InvoiceStatus;
  sellerName?: string;
  sellerTaxId?: string;
  buyerName?: string;
  buyerTaxId?: string;
  amount?: number;
  taxAmount?: number;
  totalAmount: number;
  remark?: string;
  fileId?: number;
  previewImage?: string;
}

export interface UpdateInvoiceRequest {
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceType?: InvoiceType;
  invoiceStatus?: InvoiceStatus;
  sellerName?: string;
  sellerTaxId?: string;
  buyerName?: string;
  buyerTaxId?: string;
  amount?: number;
  taxAmount?: number;
  totalAmount?: number;
  remark?: string;
}

export const getInvoices = (params: GetInvoicesParams = {}) =>
  axios.get<Page<Invoice>>("/invoices", { params });

export const getInvoiceById = (id: number) =>
  axios.get<InvoiceDetail>(`/invoices/${id}`);

export const createInvoice = (data: CreateInvoiceRequest) =>
  axios.post<InvoiceDetail>("/invoices", data);

export const parseInvoice = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post<InvoiceParseResult>("/invoices/parse", formData);
};

export const updateInvoice = (id: number, data: UpdateInvoiceRequest) =>
  axios.put<InvoiceDetail>(`/invoices/${id}`, data);

export const deleteInvoice = (id: number) =>
  axios.delete<void>(`/invoices/${id}`);

export const uploadInvoiceAttachment = (invoiceId: number, file?: File, fileId?: number) => {
  if (fileId != null) {
    return axios.post<InvoiceAttachment>(
      `/invoices/${invoiceId}/attachments?fileId=${fileId}`,
    );
  }
  const formData = new FormData();
  formData.append("file", file!);
  return axios.post<InvoiceAttachment>(
    `/invoices/${invoiceId}/attachments`,
    formData,
  );
};

export const deleteInvoiceAttachment = (
  invoiceId: number,
  attachmentId: number,
) => axios.delete<void>(`/invoices/${invoiceId}/attachments/${attachmentId}`);
