import axios from "axios";

export const getErrorMessage = (error: unknown): string | null => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? null;
  }
  return null;
};
