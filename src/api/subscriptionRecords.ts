import axios from "./axios";
import type { SubscriptionRecord, SubscriptionRecordAttachment, SubscriptionRecordInvoice } from "./subscriptions";

export interface SubscriptionRecordRequest {
  recordDate: string;
  amount: number;
  currency?: string;
  startDate: string;
  endDate?: string;
  quantity?: string;
  orderNo?: string;
  expired?: boolean;
  paymentMethodId?: number;
  note?: string;
}

export const getRecords = (subId: number) =>
  axios.get<SubscriptionRecord[]>(`/subscriptions/${subId}/records`);

export const addRecord = (subId: number, data: SubscriptionRecordRequest) =>
  axios.post<SubscriptionRecord>(`/subscriptions/${subId}/records`, data);

export const updateRecord = (subId: number, id: number, data: SubscriptionRecordRequest) =>
  axios.put<SubscriptionRecord>(`/subscriptions/${subId}/records/${id}`, data);

export const deleteRecord = (subId: number, id: number) =>
  axios.delete<void>(`/subscriptions/${subId}/records/${id}`);

export const uploadAttachment = (recordId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post<SubscriptionRecordAttachment>(
    `/subscription-records/${recordId}/attachments`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
};

export const getAttachments = (recordId: number) =>
  axios.get<SubscriptionRecordAttachment[]>(`/subscription-records/${recordId}/attachments`);

export const deleteAttachment = (recordId: number, attachmentId: number) =>
  axios.delete<void>(`/subscription-records/${recordId}/attachments/${attachmentId}`);

export const getInvoices = (recordId: number) =>
  axios.get<SubscriptionRecordInvoice[]>(`/subscription-records/${recordId}/invoices`);

export const bindInvoice = (recordId: number, invoiceId: number) =>
  axios.post<void>(`/subscription-records/${recordId}/invoices/${invoiceId}`);

export const unbindInvoice = (recordId: number, invoiceId: number) =>
  axios.delete<void>(`/subscription-records/${recordId}/invoices/${invoiceId}`);
