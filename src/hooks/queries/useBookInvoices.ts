import { useQuery } from "@tanstack/react-query";
import { getBookInvoices } from "@/api/bookInvoices";
import { bookKeys } from "./bookKeys";

export const useBookInvoices = (bookId: number | null) =>
  useQuery({
    queryKey: bookKeys.invoices(bookId ?? 0),
    queryFn: async () => {
      const { data } = await getBookInvoices(bookId!);
      return data;
    },
    enabled: bookId != null,
  });
