import { useTranslation } from "react-i18next";
import type { SubscriptionStatus } from "@/api/subscriptions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SubscriptionStatusDialogProps {
  readonly open: boolean;
  readonly currentStatus: SubscriptionStatus;
  readonly onActivate: () => void;
  readonly onKeepCurrent: () => void;
  readonly onClose: () => void;
}

const SubscriptionStatusDialog = ({
  open,
  currentStatus,
  onActivate,
  onKeepCurrent,
  onClose,
}: SubscriptionStatusDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("subscriptions.statusChange.activateTitle")}</DialogTitle>
          <DialogDescription>
            {t("subscriptions.statusChange.activateDescription", {
              status: t(`subscriptions.status.${currentStatus.toLowerCase()}`),
            })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onKeepCurrent}>
            {t("subscriptions.statusChange.keepCurrent")}
          </Button>
          <Button onClick={onActivate}>
            {t("subscriptions.statusChange.activate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionStatusDialog;
