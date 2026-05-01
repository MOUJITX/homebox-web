import axios from "./axios";

export interface Place {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlaceRequest {
  name: string;
  description?: string;
}

export interface UpdatePlaceRequest {
  name?: string;
  description?: string;
}

export const getPlaces = () => axios.get<Place[]>("/places");

export const createPlace = (data: CreatePlaceRequest) =>
  axios.post<Place>("/places", data);

export const updatePlace = (id: number, data: UpdatePlaceRequest) =>
  axios.put<Place>(`/places/${id}`, data);

export const deletePlace = (id: number) =>
  axios.delete<void>(`/places/${id}`);
