export const assetKeys = {
  all: ["assets"] as const,
  lists: () => [...assetKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...assetKeys.lists(), params] as const,
  details: () => [...assetKeys.all, "detail"] as const,
  detail: (id: number) => [...assetKeys.details(), id] as const,
  categories: ["asset-categories"] as const,
  places: ["asset-places"] as const,
  stores: ["asset-stores"] as const,
  invoices: (assetId: number) => ["asset-invoices", assetId] as const,
};
