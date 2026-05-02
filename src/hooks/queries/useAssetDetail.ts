import { useQuery } from "@tanstack/react-query";
import { getAssetById } from "@/api/assets";
import { assetKeys } from "./assetKeys";

export const useAssetDetail = (id: number | null) =>
  useQuery({
    queryKey: assetKeys.detail(id!),
    queryFn: async () => {
      const { data } = await getAssetById(id!);
      return data;
    },
    enabled: id != null,
    staleTime: 60_000,
  });
