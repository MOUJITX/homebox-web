import axios from "./axios";

export interface AssetStore {
  id: number;
  name: string;
  channel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetStoreRequest {
  name: string;
  channel?: string;
}

export interface UpdateAssetStoreRequest {
  name?: string;
  channel?: string;
}

export const getAssetStores = () =>
  axios.get<AssetStore[]>("/asset-stores");

export const createAssetStore = (data: CreateAssetStoreRequest) =>
  axios.post<AssetStore>("/asset-stores", data);

export const updateAssetStore = (id: number, data: UpdateAssetStoreRequest) =>
  axios.put<AssetStore>(`/asset-stores/${id}`, data);

export const deleteAssetStore = (id: number) =>
  axios.delete<void>(`/asset-stores/${id}`);
