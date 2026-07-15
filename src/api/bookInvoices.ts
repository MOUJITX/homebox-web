import axios from "./axios";
import type { BookInvoice } from "./books";

export { type BookInvoice };

export const getBookInvoices = (bookId: number) =>
  axios.get<BookInvoice[]>(`/books/${bookId}/invoices`);

export const bindInvoiceToBook = (bookId: number, invoiceId: number) =>
  axios.post<void>(`/books/${bookId}/invoices/${invoiceId}`);

export const unbindInvoiceFromBook = (bookId: number, invoiceId: number) =>
  axios.delete<void>(`/books/${bookId}/invoices/${invoiceId}`);
