import { useQuery } from "@tanstack/react-query";
import { getSubscriptions, type GetSubscriptionsParams, type SubscriptionType, type SubscriptionStatus } from "@/api/subscriptions";
import { subscriptionKeys } from "./subscriptionKeys";

interface UseSubscriptionsParams {
  search?: string;
  type?: SubscriptionType | null;
  status?: SubscriptionStatus | null;
  platformId?: number | null;
  page: number;
  size: number;
}

export const useSubscriptions = (params: UseSubscriptionsParams) => {
  const queryParams: GetSubscriptionsParams = {
    search: params.search || undefined,
    type: params.type ?? undefined,
    status: params.status ?? undefined,
    platformId: params.platformId ?? undefined,
    page: params.page,
    size: params.size,
    sortBy: "createdAt",
    sortDir: "desc",
  };

  return useQuery({
    queryKey: subscriptionKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: async () => {
      const { data } = await getSubscriptions(queryParams);
      return data;
    },
    placeholderData: (prev) => prev,
  });
};
