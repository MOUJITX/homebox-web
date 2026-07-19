import { useQuery } from "@tanstack/react-query";
import { getBookSeriesList, getBookSeriesForBook } from "@/api/bookSeries";
import { bookKeys } from "./bookKeys";

export const useBookSeries = () =>
  useQuery({
    queryKey: bookKeys.series,
    queryFn: async () => {
      const { data } = await getBookSeriesList();
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });

export const useBookSeriesForBook = (bookId: number | null) =>
  useQuery({
    queryKey: bookKeys.bookSeries(bookId ?? 0),
    queryFn: async () => {
      const { data } = await getBookSeriesForBook(bookId!);
      return data;
    },
    enabled: bookId != null,
  });
