import { useQuery } from "@tanstack/react-query";
import { getDocumentById } from "@/api/documents";
import { documentKeys } from "./documentKeys";

export const useDocumentDetail = (id: number | null) =>
  useQuery({
    queryKey: id != null ? documentKeys.detail(id) : ["documents", "detail", null],
    queryFn: async () => {
      const { data } = await getDocumentById(id!);
      return data;
    },
    enabled: id != null,
  });
