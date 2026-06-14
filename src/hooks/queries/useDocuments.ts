import { useQuery } from "@tanstack/react-query";
import {
  getDocuments,
  type GetDocumentsParams,
  type DocumentStatus,
  type Importance,
} from "@/api/documents";
import { documentKeys } from "./documentKeys";

interface UseDocumentsParams {
  search?: string;
  categoryId?: number | null;
  status?: DocumentStatus | null;
  importance?: Importance | null;
  parentId?: number | null;
  page: number;
  size: number;
}

export const useDocuments = (params: UseDocumentsParams) => {
  const queryParams: GetDocumentsParams = {
    search: params.search || undefined,
    categoryId: params.categoryId ?? undefined,
    status: params.status ?? undefined,
    importance: params.importance ?? undefined,
    parentId: params.parentId ?? undefined,
    page: params.page,
    size: params.size,
    sortBy: "createdAt",
    sortDir: "desc",
  };

  return useQuery({
    queryKey: documentKeys.list(
      queryParams as unknown as Record<string, unknown>,
    ),
    queryFn: async () => {
      const { data } = await getDocuments(queryParams);
      return data;
    },
    placeholderData: (prev) => prev,
  });
};
