import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { BellIcon, CheckCheckIcon, CheckIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPopup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  getUnreadCount,
  getNotifications,
  markRead,
  markAllRead,
  type Notification,
} from "@/api/notifications";
import {
  onNotificationsChanged,
  notifyChanged,
} from "@/lib/notificationEvents";

const NotificationBell = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await getUnreadCount();
      setUnreadCount(data);
    } catch {
      // handled by interceptor
    }
  }, []);

  const fetchUnreadList = useCallback(async () => {
    try {
      // Backend filter: only fetch unread notifications
      const { data } = await getNotifications(0, 5, false);
      setNotifications(data.content);
    } catch {
      // handled by interceptor
    }
  }, []);

  useEffect(() => {
    void fetchUnread();
    pollingRef.current = setInterval(fetchUnread, 30000);
    return () => clearInterval(pollingRef.current);
  }, [fetchUnread]);

  useEffect(() => {
    return onNotificationsChanged(() => {
      void fetchUnread();
    });
  }, [fetchUnread]);

  useEffect(() => {
    if (open) {
      void fetchUnreadList();
    }
  }, [open, fetchUnreadList]);

  const handleMarkRead = async (id: number) => {
    try {
      await markRead(id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      notifyChanged();
    } catch {
      // handled by interceptor
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setUnreadCount(0);
      setNotifications([]);
      notifyChanged();
    } catch {
      // handled by interceptor
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/notifications");
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
      case "MEDICATION_REMINDER":
        return t("notifications.types.medicationReminder");
      default:
        return type;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="relative flex cursor-default items-center rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <BellIcon className="size-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuPopup className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">
            {t("notifications.title")}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheckIcon className="size-3" />
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t("notifications.noNotifications")}
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex cursor-default items-start gap-2 px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {typeLabel(n.type)}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span className="text-sm">{n.content}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void handleMarkRead(n.id);
                }}
                className="shrink-0 flex items-center justify-center size-5 rounded hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                title={t("notifications.markRead")}
              >
                <CheckIcon className="size-3.5" />
              </button>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleViewAll}
          className="cursor-pointer justify-center text-sm text-muted-foreground hover:text-foreground"
        >
          {t("notifications.viewAll")}
        </DropdownMenuItem>
      </DropdownMenuPopup>
    </DropdownMenu>
  );
};

export default NotificationBell;
