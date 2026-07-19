export const bookKeys = {
  all: ["books"] as const,
  lists: () => [...bookKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...bookKeys.lists(), params] as const,
  details: () => [...bookKeys.all, "detail"] as const,
  detail: (id: number) => [...bookKeys.details(), id] as const,
  categories: ["book-categories"] as const,
  locations: ["book-locations"] as const,
  series: ["book-series"] as const,
  bookSeries: (bookId: number) =>
    [...bookKeys.series, "book", bookId] as const,
  invoices: (bookId: number) => ["book-invoices", bookId] as const,
  pictures: (bookId: number) => ["book-pictures", bookId] as const,
  children: (bookId: number) => ["book-children", bookId] as const,
  douban: (params: Record<string, unknown>) =>
    [...bookKeys.all, "douban", params] as const,
};
