import axios from "./axios";

export interface BookSeries {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookSeriesRequest {
  name: string;
  description?: string;
}

export interface UpdateBookSeriesRequest {
  name?: string;
  description?: string;
}

export const getBookSeriesList = () =>
  axios.get<BookSeries[]>("/book-series");

export const createBookSeries = (data: CreateBookSeriesRequest) =>
  axios.post<BookSeries>("/book-series", data);

export const updateBookSeries = (
  id: number,
  data: UpdateBookSeriesRequest,
) => axios.put<BookSeries>(`/book-series/${id}`, data);

export const deleteBookSeries = (id: number) =>
  axios.delete<void>(`/book-series/${id}`);

export const getBookSeriesForBook = (bookId: number) =>
  axios.get<BookSeries[]>(`/books/${bookId}/series`);

export const setBookSeriesForBook = (bookId: number, seriesIds: number[]) =>
  axios.put<BookSeries[]>(`/books/${bookId}/series`, seriesIds);
