import { useQuery } from "@tanstack/react-query";
import { getBooks, type GetBooksParams } from "@/api/books";
import { bookKeys } from "./bookKeys";

interface UseBooksParams {
  search?: string;
  categoryId?: number | null;
  locationId?: number | null;
  status?: string | null;
  page: number;
  size: number;
}

export const useBooks = (params: UseBooksParams) => {
  const queryParams: GetBooksParams = {
    search: params.search || undefined,
    categoryId: params.categoryId ?? undefined,
    locationId: params.locationId ?? undefined,
    status: params.status ?? undefined,
    page: params.page,
    size: params.size,
    sortBy: "createdAt",
    sortDir: "desc",
  };

  return useQuery({
    queryKey: bookKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: async () => {
      const { data } = await getBooks(queryParams);
      return data;
    },
    placeholderData: (prev) => prev,
  });
};
