import { useQuery } from "@tanstack/react-query";
import { getRecords } from "@/api/subscriptionRecords";
import { subscriptionKeys } from "./subscriptionKeys";

export const useSubscriptionRecords = (subId: number | null) => {
  return useQuery({
    queryKey: subscriptionKeys.records(subId!),
    queryFn: async () => {
      const { data } = await getRecords(subId!);
      return data;
    },
    enabled: subId !== null,
  });
};
