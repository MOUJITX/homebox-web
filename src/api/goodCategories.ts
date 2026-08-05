import axios from "./axios";
import type { Page } from "./goods";

export interface GoodCategory {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoodCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateGoodCategoryRequest {
  name?: string;
  description?: string;
}

export const getGoodCategories = (page = 0, size = 1000) =>
  axios.get<Page<GoodCategory>>("/good-categories", {
    params: { page, size },
  });

export const createGoodCategory = (data: CreateGoodCategoryRequest) =>
  axios.post<GoodCategory>("/good-categories", data);

export const updateGoodCategory = (
  id: number,
  data: UpdateGoodCategoryRequest,
) => axios.put<GoodCategory>(`/good-categories/${id}`, data);

export const deleteGoodCategory = (id: number) =>
  axios.delete<void>(`/good-categories/${id}`);
