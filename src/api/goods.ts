import axios from "./axios";
import type { GoodAttachment } from "./goodAttachments";

export type GoodStatus = "IN_USE" | "NOT_IN_USE";

export type ItemStatus = "EXPIRED" | "EXPIRING_SOON" | "IN_USE" | "EXHAUSTED";

export interface GoodPicture {
  id: number;
  filename: string;
  contentType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export interface GoodItem {
  id: number;
  productDate: string;
  expirationDate: string;
  lifeDays: number;
  inUse: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Good {
  id: number;
  productName: string;
  barcode: string;
  categoryName: string;
  categoryId: number;
  brandName: string;
  brandId: number;
  expiringSoonDays: number;
  itemCountTotal: number;
  itemCountInUse: number;
  status: GoodStatus;
  firstPictureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoodDetail extends Good {
  items: GoodItem[];
  pictures: GoodPicture[];
  attachments: GoodAttachment[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface GetGoodsParams {
  search?: string;
  categoryId?: number;
  brandId?: number;
  status?: GoodStatus;
  itemStatus?: ItemStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface CreateGoodRequest {
  productName: string;
  barcode: string;
  categoryId: number;
  brandId: number;
  expiringSoonDays?: number;
}

export interface UpdateGoodRequest {
  productName?: string;
  barcode?: string;
  categoryId?: number;
  brandId?: number;
  expiringSoonDays?: number;
}

export const getGoods = (params: GetGoodsParams = {}) =>
  axios.get<Page<Good>>("/goods", { params });

export const getGoodById = (id: number) =>
  axios.get<GoodDetail>(`/goods/${id}`);

export const getGoodByBarcode = (barcode: string) =>
  axios.get<Good>(`/goods/barcode/${barcode}`);

export const createGood = (data: CreateGoodRequest) =>
  axios.post<GoodDetail>("/goods", data);

export const updateGood = (id: number, data: UpdateGoodRequest) =>
  axios.put<GoodDetail>(`/goods/${id}`, data);

export const deleteGood = (id: number) => axios.delete<void>(`/goods/${id}`);
