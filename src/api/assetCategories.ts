import axios from "./axios";

export interface AssetCategory {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateAssetCategoryRequest {
  name?: string;
  description?: string;
}

export const getAssetCategories = () =>
  axios.get<AssetCategory[]>("/asset-categories");

export const createAssetCategory = (data: CreateAssetCategoryRequest) =>
  axios.post<AssetCategory>("/asset-categories", data);

export const updateAssetCategory = (
  id: number,
  data: UpdateAssetCategoryRequest,
) => axios.put<AssetCategory>(`/asset-categories/${id}`, data);

export const deleteAssetCategory = (id: number) =>
  axios.delete<void>(`/asset-categories/${id}`);
