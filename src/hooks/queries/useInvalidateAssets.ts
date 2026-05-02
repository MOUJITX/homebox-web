import { useQueryClient } from "@tanstack/react-query";
import { assetKeys } from "./assetKeys";

export const useInvalidateAssets = () => {
  const queryClient = useQueryClient();
  return {
    invalidateList: () =>
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() }),
    invalidateDetail: (id: number) =>
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(id) }),
    invalidateCategories: () =>
      queryClient.invalidateQueries({ queryKey: assetKeys.categories }),
    invalidatePlaces: () =>
      queryClient.invalidateQueries({ queryKey: assetKeys.places }),
    invalidateStores: () =>
      queryClient.invalidateQueries({ queryKey: assetKeys.stores }),
    invalidateInvoices: (assetId: number) =>
      queryClient.invalidateQueries({
        queryKey: assetKeys.invoices(assetId),
      }),
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: assetKeys.all }),
  };
};
