import axiosLib from "axios";
import { toast } from "sonner";
import i18n from "@/i18n";

const TOKEN_KEY = "homebox_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) =>
  localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const axios = axiosLib.create({
  baseURL: "/api",
});

axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      clearToken();
      onSessionExpired?.();
    } else if (error.response) {
      const message =
        error.response.data?.message || i18n.t("errorToast.requestFailed");
      toast.error(message);
    } else {
      toast.error(i18n.t("errorToast.networkError"));
    }
    return Promise.reject(error);
  },
);

export default axios;
