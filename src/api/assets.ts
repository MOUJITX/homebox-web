import axios from "./axios";

export type WarrantyStatus = "IN_WARRANTY" | "OUT_WARRANTY" | "NO_WARRANTY";

export interface AssetPicture {
  id: number;
  filename: string;
  contentType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export interface Asset {
  id: number;
  name: string;
  barcode: string | null;
  serialNumber: string | null;
  categoryName: string;
  categoryId: number;
  placeName: string;
  placeId: number;
  inUse: boolean;
  retireDate: string | null;
  price: number | null;
  totalPrice: number;
  shopDate: string | null;
  storeName: string | null;
  storeId: number | null;
  hasWarranty: boolean;
  warrantyStatus: WarrantyStatus;
  expirationDate: string | null;
  note: string | null;
  firstPictureUrl: string | null;
  hasInvoice: boolean;
  subAssetCount: number;
  parentId: number | null;
  parentName: string | null;
  parentFirstPictureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetDetail extends Asset {
  activeDate: string | null;
  warrantyPeriod: number | null;
  pictures: AssetPicture[];
  subAssets: Asset[];
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

export interface GetAssetsParams {
  search?: string;
  categoryId?: number;
  placeId?: number;
  isInUse?: boolean;
  warrantyStatus?: WarrantyStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface CreateAssetRequest {
  name: string;
  barcode?: string;
  serialNumber?: string;
  categoryId: number;
  placeId: number;
  inUse?: boolean;
  retireDate?: string;
  price?: number;
  shopDate?: string;
  storeId?: number;
  hasWarranty?: boolean;
  activeDate?: string;
  warrantyPeriod?: number;
  expirationDate?: string;
  note?: string;
  parentId?: number;
}

export interface UpdateAssetRequest {
  name?: string;
  barcode?: string;
  serialNumber?: string;
  categoryId?: number;
  placeId?: number;
  inUse?: boolean;
  retireDate?: string;
  price?: number;
  shopDate?: string;
  storeId?: number;
  hasWarranty?: boolean;
  activeDate?: string;
  warrantyPeriod?: number;
  expirationDate?: string;
  note?: string;
}

export const getAssets = (params: GetAssetsParams = {}) =>
  axios.get<Page<Asset>>("/assets", { params });

export const getAssetById = (id: number) =>
  axios.get<AssetDetail>(`/assets/${id}`);

export const createAsset = (data: CreateAssetRequest) =>
  axios.post<AssetDetail>("/assets", data);

export const updateAsset = (id: number, data: UpdateAssetRequest) =>
  axios.put<AssetDetail>(`/assets/${id}`, data);

export const deleteAsset = (id: number) =>
  axios.delete<void>(`/assets/${id}`);
