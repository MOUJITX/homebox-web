import { useQueryClient } from "@tanstack/react-query";
import { documentKeys } from "./documentKeys";

export const useInvalidateDocuments = () => {
  const queryClient = useQueryClient();
  return {
    invalidateList: () =>
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() }),
    invalidateDetail: (id: number) =>
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) }),
    invalidateCategories: () =>
      queryClient.invalidateQueries({
        queryKey: documentKeys.categories,
      }),
    invalidateAttachments: (documentId: number) =>
      queryClient.invalidateQueries({
        queryKey: documentKeys.attachments(documentId),
      }),
    invalidateInvoices: (documentId: number) =>
      queryClient.invalidateQueries({
        queryKey: documentKeys.invoices(documentId),
      }),
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  };
};
