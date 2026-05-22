import { useQuery } from "@tanstack/react-query";
import { getPaymentMethods } from "@/api/paymentMethods";
import { subscriptionKeys } from "./subscriptionKeys";

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: subscriptionKeys.paymentMethods,
    queryFn: async () => {
      const { data } = await getPaymentMethods();
      return data;
    },
  });
};
