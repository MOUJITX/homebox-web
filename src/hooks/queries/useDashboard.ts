import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/api/dashboard";
import { dashboardKeys } from "./dashboardKeys";

export const useDashboard = () =>
  useQuery({
    queryKey: dashboardKeys.detail(),
    queryFn: async () => {
      const { data } = await getDashboard();
      return data;
    },
  });
