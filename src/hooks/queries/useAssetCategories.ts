import { useQuery } from "@tanstack/react-query";
import { getAssetCategories } from "@/api/assetCategories";
import { assetKeys } from "./assetKeys";

export const useAssetCategories = () =>
  useQuery({
    queryKey: assetKeys.categories,
    queryFn: async () => {
      const { data } = await getAssetCategories();
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
