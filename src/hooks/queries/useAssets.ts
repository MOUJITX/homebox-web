import { useQuery } from "@tanstack/react-query";
import { getAssets, type GetAssetsParams, type WarrantyStatus } from "@/api/assets";
import { assetKeys } from "./assetKeys";

interface UseAssetsParams {
  search?: string;
  categoryId?: number | null;
  placeId?: number | null;
  isInUse?: boolean | null;
  warrantyStatus?: WarrantyStatus | null;
  page: number;
  size: number;
}

export const useAssets = (params: UseAssetsParams) => {
  const queryParams: GetAssetsParams = {
    search: params.search || undefined,
    categoryId: params.categoryId ?? undefined,
    placeId: params.placeId ?? undefined,
    isInUse: params.isInUse ?? undefined,
    warrantyStatus: params.warrantyStatus ?? undefined,
    page: params.page,
    size: params.size,
    sortBy: "createdAt",
    sortDir: "desc",
  };

  return useQuery({
    queryKey: assetKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: async () => {
      const { data } = await getAssets(queryParams);
      return data;
    },
    placeholderData: (prev) => prev,
  });
};
