export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  lists: () => [...subscriptionKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...subscriptionKeys.lists(), params] as const,
  details: () => [...subscriptionKeys.all, "detail"] as const,
  detail: (id: number) => [...subscriptionKeys.details(), id] as const,
  records: (subId: number) => ["subscription-records", subId] as const,
  attachments: (recordId: number) => ["subscription-attachments", recordId] as const,
  invoices: (recordId: number) => ["subscription-invoices", recordId] as const,
  platforms: ["platforms"] as const,
  paymentMethods: ["payment-methods"] as const,
};
