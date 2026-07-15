import axios from "./axios";

export interface BookCategory {
  id: number;
  name: string;
  key: string;
  serialized: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookCategoryRequest {
  name: string;
  key: string;
  serialized?: boolean;
  description?: string;
}

export interface UpdateBookCategoryRequest {
  name?: string;
  key?: string;
  serialized?: boolean;
  description?: string;
}

export const getBookCategories = () =>
  axios.get<BookCategory[]>("/book-categories");

export const createBookCategory = (data: CreateBookCategoryRequest) =>
  axios.post<BookCategory>("/book-categories", data);

export const updateBookCategory = (
  id: number,
  data: UpdateBookCategoryRequest,
) => axios.put<BookCategory>(`/book-categories/${id}`, data);

export const deleteBookCategory = (id: number) =>
  axios.delete<void>(`/book-categories/${id}`);
