export const dashboardKeys = {
  all: ["dashboard"] as const,
  detail: () => [...dashboardKeys.all, "detail"] as const,
};
