import { useQuery } from "@tanstack/react-query";
import { getAssetInvoices } from "@/api/assetInvoices";
import { assetKeys } from "./assetKeys";

export const useAssetInvoices = (assetId: number) =>
  useQuery({
    queryKey: assetKeys.invoices(assetId),
    queryFn: async () => {
      const { data } = await getAssetInvoices(assetId);
      return data;
    },
    staleTime: 30_000,
  });
