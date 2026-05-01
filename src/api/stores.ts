import axios from "./axios";

export interface Store {
  id: number;
  name: string;
  channel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreRequest {
  name: string;
  channel?: string;
}

export interface UpdateStoreRequest {
  name?: string;
  channel?: string;
}

export const getStores = () => axios.get<Store[]>("/stores");

export const createStore = (data: CreateStoreRequest) =>
  axios.post<Store>("/stores", data);

export const updateStore = (id: number, data: UpdateStoreRequest) =>
  axios.put<Store>(`/stores/${id}`, data);

export const deleteStore = (id: number) =>
  axios.delete<void>(`/stores/${id}`);
