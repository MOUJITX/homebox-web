import axios from "./axios";

export type InvoiceType =
  | "DIGITAL_INVOICE"
  | "RAILWAY_ELECTRONIC"
  | "VAT_INVOICE"
  | "AIR_ELECTRONIC"
  | "GENERAL_MACHINE_PRINTED"
  | "QUOTA_INVOICE"
  | "OTHER";

export type InvoiceStatus = "NORMAL" | "VOIDED" | "RED_FLUSHED";

export interface Invoice {
  id: number;
  invoiceCode: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceAttachment {
  id: number;
  filename: string;
  contentType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export interface InvoiceDetail extends Invoice {
  sellerTaxId: string | null;
  buyerTaxId: string | null;
  remark: string | null;
  fileId: number | null;
  fileUrl: string | null;
  attachments: InvoiceAttachment[];
}

export interface InvoiceParseResult {
  invoiceCode: string | null;
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
  invoiceCode?: string;
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
}

export interface UpdateInvoiceRequest {
  invoiceCode?: string;
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

export const uploadInvoiceAttachment = (invoiceId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post<InvoiceAttachment>(
    `/invoices/${invoiceId}/attachments`,
    formData,
  );
};

export const deleteInvoiceAttachment = (
  invoiceId: number,
  attachmentId: number,
) => axios.delete<void>(`/invoices/${invoiceId}/attachments/${attachmentId}`);
