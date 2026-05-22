import axios from "./axios";

export type SubscriptionType = "PAY_AS_YOU_GO" | "PERIODIC";
export type BillingMode = "PREPAID" | "POSTPAID";
export type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "CANCELLED";

export interface Subscription {
  id: number;
  name: string;
  description: string | null;
  subscriptionType: SubscriptionType;
  billingMode: BillingMode | null;
  billingCycleDays: number | null;
  price: number | null;
  currency: string;
  platformId: number;
  platformName: string;
  platformLogoUrl: string | null;
  status: SubscriptionStatus;
  renewNoticeDays: number;
  note: string | null;
  latestRecordDate: string | null;
  latestRecordAmount: number | null;
  latestRecordEndDate: string | null;
  hasInvoice: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionDetail extends Subscription {
  platformWebsite: string | null;
  records: SubscriptionRecord[];
}

export interface SubscriptionRecord {
  id: number;
  subscriptionId: number;
  recordDate: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  quantity: string | null;
  paymentMethodId: number | null;
  paymentMethodName: string | null;
  paymentMethodLogoUrl: string | null;
  note: string | null;
  attachments: SubscriptionRecordAttachment[];
  invoices: SubscriptionRecordInvoice[];
  createdAt: string;
}

export interface SubscriptionRecordAttachment {
  id: number;
  filename: string;
  contentType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export interface SubscriptionRecordInvoice {
  id: number;
  invoiceId: number;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  invoiceType: string;
  invoiceStatus: string;
  totalAmount: number;
  sellerName: string | null;
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

export interface GetSubscriptionsParams {
  search?: string;
  type?: SubscriptionType;
  status?: SubscriptionStatus;
  platformId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface SubscriptionRequest {
  name: string;
  description?: string;
  subscriptionType: SubscriptionType;
  billingMode?: BillingMode;
  billingCycleDays?: number;
  price?: number;
  currency?: string;
  platformId: number;
  status?: SubscriptionStatus;
  renewNoticeDays?: number;
  note?: string;
}

export const getSubscriptions = (params: GetSubscriptionsParams = {}) =>
  axios.get<Page<Subscription>>("/subscriptions", { params });

export const getSubscriptionById = (id: number) =>
  axios.get<SubscriptionDetail>(`/subscriptions/${id}`);

export const createSubscription = (data: SubscriptionRequest) =>
  axios.post<SubscriptionDetail>("/subscriptions", data);

export const updateSubscription = (id: number, data: SubscriptionRequest) =>
  axios.put<SubscriptionDetail>(`/subscriptions/${id}`, data);

export const deleteSubscription = (id: number) =>
  axios.delete<void>(`/subscriptions/${id}`);
