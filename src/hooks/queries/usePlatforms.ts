import { useQuery } from "@tanstack/react-query";
import { getPlatforms } from "@/api/platforms";
import { subscriptionKeys } from "./subscriptionKeys";

export const usePlatforms = () => {
  return useQuery({
    queryKey: subscriptionKeys.platforms,
    queryFn: async () => {
      const { data } = await getPlatforms();
      return data;
    },
  });
};
