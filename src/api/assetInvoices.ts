import axios from "./axios";
import type { InvoiceType, InvoiceStatus } from "./invoices";

export interface AssetInvoice {
  id: number;
  invoiceId: number;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  invoiceType: InvoiceType;
  invoiceStatus: InvoiceStatus;
  totalAmount: number | null;
}

export interface BoundAsset {
  id: number;
  assetId: number;
  name: string;
  barcode: string | null;
  firstPictureUrl: string | null;
}

export const getAssetInvoices = (assetId: number) =>
  axios.get<AssetInvoice[]>(`/assets/${assetId}/invoices`);

export const bindInvoiceToAsset = (assetId: number, invoiceId: number) =>
  axios.post<void>(`/assets/${assetId}/invoices/${invoiceId}`);

export const unbindInvoiceFromAsset = (assetId: number, invoiceId: number) =>
  axios.delete<void>(`/assets/${assetId}/invoices/${invoiceId}`);
