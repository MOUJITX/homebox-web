import axios from "./axios";

export interface PaymentMethod {
  id: number;
  name: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodRequest {
  name: string;
  logoFileId?: number;
}

export const getPaymentMethods = () =>
  axios.get<PaymentMethod[]>("/payment-methods");

export const createPaymentMethod = (data: PaymentMethodRequest) =>
  axios.post<PaymentMethod>("/payment-methods", data);

export const updatePaymentMethod = (id: number, data: PaymentMethodRequest) =>
  axios.put<PaymentMethod>(`/payment-methods/${id}`, data);

export const deletePaymentMethod = (id: number) =>
  axios.delete<void>(`/payment-methods/${id}`);
