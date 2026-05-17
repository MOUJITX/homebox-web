import axios from "@/api/axios";

export type NotificationType =
  | "ITEM_EXPIRING"
  | "ITEM_EXPIRED"
  | "WARRANTY_EXPIRING"
  | "WARRANTY_EXPIRED";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationPage {
  content: Notification[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export const getNotifications = (page: number, size: number, isRead?: boolean) =>
  axios.get<NotificationPage>("/notifications", {
    params: { page, size, ...(isRead !== undefined && { isRead }) },
  });

export const getUnreadCount = () =>
  axios.get<number>("/notifications/unread-count");

export const markRead = (id: number) =>
  axios.put(`/notifications/${id}/read`);

export const markAllRead = () =>
  axios.put("/notifications/read-all");

export const testWebhook = () =>
  axios.post<{ success: boolean; message: string }>("/notifications/test-webhook");
