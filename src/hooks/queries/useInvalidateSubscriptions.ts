import { useQueryClient } from "@tanstack/react-query";
import { subscriptionKeys } from "./subscriptionKeys";

export const useInvalidateSubscriptions = () => {
  const queryClient = useQueryClient();

  return {
    invalidateLists: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
    invalidateDetail: (id: number) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(id) });
    },
    invalidateRecords: (subId: number) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.records(subId),
      });
    },
    invalidateAttachments: (recordId: number) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.attachments(recordId),
      });
    },
    invalidateInvoices: (recordId: number) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.invoices(recordId),
      });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  };
};
