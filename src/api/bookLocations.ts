import axios from "./axios";

export interface BookLocation {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookLocationRequest {
  name: string;
  description?: string;
}

export interface UpdateBookLocationRequest {
  name?: string;
  description?: string;
}

export const getBookLocations = () =>
  axios.get<BookLocation[]>("/book-locations");

export const createBookLocation = (data: CreateBookLocationRequest) =>
  axios.post<BookLocation>("/book-locations", data);

export const updateBookLocation = (
  id: number,
  data: UpdateBookLocationRequest,
) => axios.put<BookLocation>(`/book-locations/${id}`, data);

export const deleteBookLocation = (id: number) =>
  axios.delete<void>(`/book-locations/${id}`);
