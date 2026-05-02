import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Asset } from "@/api/assets";
import { deleteAsset } from "@/api/assets";
import { getErrorMessage } from "@/lib/error";
import { useInvalidateAssets } from "@/hooks/queries/useInvalidateAssets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteAssetDialogProps {
  readonly open: boolean;
  readonly asset: Asset | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const DeleteAssetDialog = ({
  open,
  asset,
  onClose,
  onSuccess,
}: DeleteAssetDialogProps) => {
  const { t } = useTranslation();
  const invalidate = useInvalidateAssets();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleDelete = async () => {
    if (deleting || !asset) return;
    setError("");
    setDeleting(true);

    try {
      await deleteAsset(asset.id);
      handleClose();
      void invalidate.invalidateList();
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("assets.errors.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("assets.delete")}</DialogTitle>
          <DialogDescription>
            {t("assets.deleteConfirm", { name: asset.name })}
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

export default DeleteAssetDialog;
