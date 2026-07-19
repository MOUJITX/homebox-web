import { useQuery } from "@tanstack/react-query";
import { getBookLocations } from "@/api/bookLocations";
import { bookKeys } from "./bookKeys";

export const useBookLocations = () =>
  useQuery({
    queryKey: bookKeys.locations,
    queryFn: async () => {
      const { data } = await getBookLocations();
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
