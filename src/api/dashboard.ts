import axios from "./axios";
import type { WarrantyStatus } from "./assets";

export interface DashboardStats {
  itemCount: number;
  assetCount: number;
  totalAssetPrice: number;
  invoiceCount: number;
}

export interface ExpiringSoonItem {
  id: number;
  goodId: number;
  productName: string;
  categoryName: string;
  brandName: string;
  expirationDate: string;
  lifeDays: number;
  createdAt: string;
}

export interface InUseItem {
  id: number;
  goodId: number;
  productName: string;
  categoryName: string;
  brandName: string;
  expirationDate: string;
  lifeDays: number;
  createdAt: string;
}

export interface WarrantyExpiringAsset {
  id: number;
  name: string;
  categoryName: string;
  placeName: string;
  price: number | null;
  expirationDate: string;
  shopDate: string | null;
}

export interface InUseAsset {
  id: number;
  name: string;
  categoryName: string;
  placeName: string;
  price: number | null;
  shopDate: string | null;
  hasWarranty: boolean;
  warrantyStatus: WarrantyStatus;
  expirationDate: string | null;
}

export interface DashboardData {
  stats: DashboardStats;
  expiringSoonItems: ExpiringSoonItem[];
  inUseItems: InUseItem[];
  warrantyExpiringAssets: WarrantyExpiringAsset[];
  inUseAssets: InUseAsset[];
}

export const getDashboard = () => axios.get<DashboardData>("/dashboard");
