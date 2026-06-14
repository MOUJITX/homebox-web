export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...documentKeys.lists(), params] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: number) => [...documentKeys.details(), id] as const,
  categories: ["document-categories"] as const,
  attachments: (documentId: number) =>
    ["document-attachments", documentId] as const,
  invoices: (documentId: number) =>
    ["document-invoices", documentId] as const,
};
