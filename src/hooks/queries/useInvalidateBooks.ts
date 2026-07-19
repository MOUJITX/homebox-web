import { useQueryClient } from "@tanstack/react-query";
import { bookKeys } from "./bookKeys";

export const useInvalidateBooks = () => {
  const queryClient = useQueryClient();
  return {
    invalidateList: () =>
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() }),
    invalidateDetail: (id: number) =>
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(id) }),
    invalidateCategories: () =>
      queryClient.invalidateQueries({ queryKey: bookKeys.categories }),
    invalidateLocations: () =>
      queryClient.invalidateQueries({ queryKey: bookKeys.locations }),
    invalidateSeries: () =>
      queryClient.invalidateQueries({ queryKey: bookKeys.series }),
    invalidateInvoices: (bookId: number) =>
      queryClient.invalidateQueries({
        queryKey: bookKeys.invoices(bookId),
      }),
    invalidateChildren: (bookId: number) =>
      queryClient.invalidateQueries({
        queryKey: bookKeys.children(bookId),
      }),
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: bookKeys.all }),
  };
};
