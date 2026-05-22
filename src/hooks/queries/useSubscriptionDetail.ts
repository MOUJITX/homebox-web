import { useQuery } from "@tanstack/react-query";
import { getSubscriptionById } from "@/api/subscriptions";
import { subscriptionKeys } from "./subscriptionKeys";

export const useSubscriptionDetail = (id: number | null) => {
  return useQuery({
    queryKey: subscriptionKeys.detail(id!),
    queryFn: async () => {
      const { data } = await getSubscriptionById(id!);
      return data;
    },
    enabled: id !== null,
  });
};
