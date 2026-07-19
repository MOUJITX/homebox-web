import { useQuery } from "@tanstack/react-query";
import { getBookCategories } from "@/api/bookCategories";
import { bookKeys } from "./bookKeys";

export const useBookCategories = () =>
  useQuery({
    queryKey: bookKeys.categories,
    queryFn: async () => {
      const { data } = await getBookCategories();
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
