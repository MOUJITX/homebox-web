import axios from "./axios";

export interface AssetPlace {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetPlaceRequest {
  name: string;
  description?: string;
}

export interface UpdateAssetPlaceRequest {
  name?: string;
  description?: string;
}

export const getAssetPlaces = () => axios.get<AssetPlace[]>("/asset-places");

export const createAssetPlace = (data: CreateAssetPlaceRequest) =>
  axios.post<AssetPlace>("/asset-places", data);

export const updateAssetPlace = (id: number, data: UpdateAssetPlaceRequest) =>
  axios.put<AssetPlace>(`/asset-places/${id}`, data);

export const deleteAssetPlace = (id: number) =>
  axios.delete<void>(`/asset-places/${id}`);
