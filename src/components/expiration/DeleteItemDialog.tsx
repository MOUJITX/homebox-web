import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GoodItem } from "@/api/goods";
import { deleteGoodItem } from "@/api/goodItems";
import { getErrorMessage } from "@/lib/error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteItemDialogProps {
  readonly open: boolean;
  readonly goodId: number;
  readonly item: GoodItem | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const DeleteItemDialog = ({
  open,
  goodId,
  item,
  onClose,
  onSuccess,
}: DeleteItemDialogProps) => {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleDelete = async () => {
    if (deleting || !item) return;
    setError("");
    setDeleting(true);

    try {
      await deleteGoodItem(goodId, item.id);
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("goods.items.errors.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("goods.items.delete")}</DialogTitle>
          <DialogDescription>
            {t("goods.items.deleteConfirm")}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? t("common.deleting") : t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteItemDialog;
