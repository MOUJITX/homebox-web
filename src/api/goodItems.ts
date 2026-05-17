import axios from "./axios";
import type { GoodItem, ItemStatus } from "./goods";

export interface CreateGoodItemRequest {
  productDate?: string;
  expirationDate?: string;
  lifeDays?: number;
  inUse?: boolean;
  quantity?: number;
}

export type UpdateGoodItemRequest = Omit<CreateGoodItemRequest, "quantity">;

export const getGoodItems = (goodId: number, itemStatus?: ItemStatus) =>
  axios.get<GoodItem[]>(`/goods/${goodId}/items`, {
    params: itemStatus ? { itemStatus } : undefined,
  });

export const createGoodItem = (goodId: number, data: CreateGoodItemRequest) =>
  axios.post<GoodItem[]>(`/goods/${goodId}/items`, data);

export const updateGoodItem = (
  goodId: number,
  itemId: number,
  data: UpdateGoodItemRequest,
) => axios.put<GoodItem>(`/goods/${goodId}/items/${itemId}`, data);

export const deleteGoodItem = (goodId: number, itemId: number) =>
  axios.delete<void>(`/goods/${goodId}/items/${itemId}`);
