import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Good } from "@/api/goods";
import { deleteGood } from "@/api/goods";
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

interface DeleteGoodDialogProps {
  readonly open: boolean;
  readonly good: Good | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const DeleteGoodDialog = ({
  open,
  good,
  onClose,
  onSuccess,
}: DeleteGoodDialogProps) => {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleDelete = async () => {
    if (deleting || !good) return;
    setError("");
    setDeleting(true);

    try {
      await deleteGood(good.id);
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("goods.errors.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  if (!good) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("goods.delete")}</DialogTitle>
          <DialogDescription>
            {t("goods.deleteConfirm", { name: good.productName })}
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

export default DeleteGoodDialog;
