import { useQuery } from "@tanstack/react-query";
import { getDocumentCategories } from "@/api/documentCategories";
import { documentKeys } from "./documentKeys";

export const useDocumentCategories = () =>
  useQuery({
    queryKey: documentKeys.categories,
    queryFn: async () => {
      const { data } = await getDocumentCategories();
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
