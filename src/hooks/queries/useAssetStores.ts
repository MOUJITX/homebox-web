import { useQuery } from "@tanstack/react-query";
import { getAssetStores } from "@/api/assetStores";
import { assetKeys } from "./assetKeys";

export const useAssetStores = () =>
  useQuery({
    queryKey: assetKeys.stores,
    queryFn: async () => {
      const { data } = await getAssetStores();
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
