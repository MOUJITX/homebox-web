import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CheckCheckIcon } from "lucide-react";
import {
  getNotifications,
  markRead,
  markAllRead,
  type Notification,
} from "@/api/notifications";
import { notifyChanged } from "@/lib/notificationEvents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination, PAGE_SIZE_OPTIONS } from "@/components/ui/pagination";

const NotificationsPage = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getNotifications(page, pageSize);
      setNotifications(data.content);
      setTotalPages(data.totalPages);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      await markRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
        ),
      );
      notifyChanged();
    } catch {
      // handled by interceptor
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
      );
      notifyChanged();
    } catch {
      // handled by interceptor
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "ITEM_EXPIRING":
        return t("notifications.types.itemExpiring");
      case "ITEM_EXPIRED":
        return t("notifications.types.itemExpired");
      case "WARRANTY_EXPIRING":
        return t("notifications.types.warrantyExpiring");
      case "WARRANTY_EXPIRED":
        return t("notifications.types.warrantyExpired");
      default:
        return type;
    }
  };

  const typeVariant = (type: string) => {
    switch (type) {
      case "ITEM_EXPIRED":
      case "WARRANTY_EXPIRED":
        return "destructive" as const;
      case "ITEM_EXPIRING":
      case "WARRANTY_EXPIRING":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("notifications.title")}</h1>
        <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
          <CheckCheckIcon className="size-4" />
          {t("notifications.markAllRead")}
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {t("notifications.noNotifications")}
        </div>
      ) : (
        <div className="grid gap-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-lg border p-4 transition-colors cursor-pointer ${
                n.isRead ? "bg-card" : "bg-primary/5 border-primary/20"
              }`}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
            >
              <Badge variant={typeVariant(n.type)} className="shrink-0 mt-0.5">
                {typeLabel(n.type)}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{n.content}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              {!n.isRead && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
