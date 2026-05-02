import { useQuery } from "@tanstack/react-query";
import { getAssetPlaces } from "@/api/assetPlaces";
import { assetKeys } from "./assetKeys";

export const useAssetPlaces = () =>
  useQuery({
    queryKey: assetKeys.places,
    queryFn: async () => {
      const { data } = await getAssetPlaces();
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
