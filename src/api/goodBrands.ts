import axios from "./axios";

export interface GoodBrand {
  id: number;
  brandName: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoodBrandRequest {
  brandName: string;
  companyName?: string;
}

export interface UpdateGoodBrandRequest {
  brandName?: string;
  companyName?: string;
}

export const getGoodBrands = () => axios.get<GoodBrand[]>("/good-brands");

export const createGoodBrand = (data: CreateGoodBrandRequest) =>
  axios.post<GoodBrand>("/good-brands", data);

export const updateGoodBrand = (id: number, data: UpdateGoodBrandRequest) =>
  axios.put<GoodBrand>(`/good-brands/${id}`, data);

export const deleteGoodBrand = (id: number) =>
  axios.delete<void>(`/good-brands/${id}`);
