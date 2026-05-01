import type { InvoiceType, InvoiceStatus } from "@/api/invoices";

export const INVOICE_TYPES: InvoiceType[] = [
  "DIGITAL_INVOICE",
  "RAILWAY_ELECTRONIC",
  "VAT_INVOICE",
  "AIR_ELECTRONIC",
  "GENERAL_MACHINE_PRINTED",
  "QUOTA_INVOICE",
  "OTHER",
];

export const INVOICE_STATUSES: InvoiceStatus[] = ["NORMAL", "VOIDED", "RED_FLUSHED"];
