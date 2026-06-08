import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TrashIcon } from "lucide-react";
import type { Subscription } from "@/api/subscriptions";
import { deleteSubscription } from "@/api/subscriptions";
import { getErrorMessage } from "@/lib/error";
import { useQueryClient } from "@tanstack/react-query";
import { subscriptionKeys } from "@/hooks/queries/subscriptionKeys";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteSubscriptionDialogProps {
  readonly open: boolean;
  readonly subscription: Subscription | null;
  readonly onClose: () => void;
}

const DeleteSubscriptionDialog = ({
  open,
  subscription,
  onClose,
}: DeleteSubscriptionDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!subscription) return;
    setDeleting(true);
    setError("");
    try {
      await deleteSubscription(subscription.id);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("common.error"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("subscriptions.delete")}</DialogTitle>
          <DialogDescription>
            {t("subscriptions.deleteConfirm", {
              name: subscription?.name ?? "",
            })}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <TrashIcon className="size-3.5" />
            {deleting ? t("common.saving") : t("subscriptions.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSubscriptionDialog;
