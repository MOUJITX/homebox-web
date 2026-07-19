import { useQuery } from "@tanstack/react-query";
import { getBookById } from "@/api/books";
import { bookKeys } from "./bookKeys";

export const useBookDetail = (bookId: number | null) =>
  useQuery({
    queryKey: bookKeys.detail(bookId ?? 0),
    queryFn: async () => {
      const { data } = await getBookById(bookId!);
      return data;
    },
    enabled: bookId != null,
  });
