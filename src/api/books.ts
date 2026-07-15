import axios from "./axios";

export type BookStatus = "WANT_TO_READ" | "READING" | "READ";

export interface BookPicture {
  id: number;
  fileId: number;
  filename: string;
  contentType: string;
  fileSize: number;
  url: string;
}

export interface Book {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  customBarcode: string;
  serialized: boolean;
  parentId: number | null;
  issueNumber: string | null;
  publisher: string | null;
  publishDate: string | null;
  description: string | null;
  categoryId: number;
  categoryName: string;
  locationId: number;
  locationName: string;
  status: BookStatus;
  purchaseDate: string | null;
  purchasePrice: number | null;
  note: string | null;
  firstPictureUrl: string | null;
  hasInvoice: boolean;
  childCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookDetail extends Book {
  parentName: string | null;
  pictures: BookPicture[];
  children: Book[];
  series: BookSeriesItem[];
  invoices: BookInvoice[];
}

export interface BookSeriesItem {
  id: number;
  name: string;
  description: string | null;
}

export interface BookInvoice {
  id: number;
  invoiceId: number;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  invoiceType: string;
  invoiceStatus: string;
  totalAmount: number | null;
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

export interface GetBooksParams {
  search?: string;
  categoryId?: number;
  locationId?: number;
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface CreateBookRequest {
  title: string;
  author?: string;
  isbn?: string;
  serialized?: boolean;
  parentId?: number;
  issueNumber?: string;
  publisher?: string;
  publishDate?: string;
  description?: string;
  categoryId: number;
  locationId: number;
  status?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  note?: string;
  seriesIds?: number[];
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  isbn?: string;
  serialized?: boolean;
  issueNumber?: string;
  publisher?: string;
  publishDate?: string;
  description?: string;
  categoryId?: number;
  locationId?: number;
  status?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  note?: string;
  seriesIds?: number[];
}

export interface DoubanLookupResult {
  title?: string;
  author?: string;
  publisher?: string;
  publishDate?: string;
  description?: string;
  coverUrl?: string;
  isbn?: string;
  candidates?: DoubanLookupResult[];
}

export const getBooks = (params: GetBooksParams = {}) =>
  axios.get<Page<Book>>("/books", { params });

export const getBookById = (id: number) =>
  axios.get<BookDetail>(`/books/${id}`);

export const createBook = (data: CreateBookRequest) =>
  axios.post<BookDetail>("/books", data);

export const updateBook = (id: number, data: UpdateBookRequest) =>
  axios.put<BookDetail>(`/books/${id}`, data);

export const deleteBook = (id: number) =>
  axios.delete<void>(`/books/${id}`);

export const getBookChildren = (id: number) =>
  axios.get<Book[]>(`/books/${id}/children`);

export const lookupDouban = (params: { isbn?: string; issn?: string; q?: string }) =>
  axios.get<DoubanLookupResult>("/books/lookup-douban", { params });
