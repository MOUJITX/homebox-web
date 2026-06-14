import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Document } from "@/api/documents";
import { deleteDocument } from "@/api/documents";
import { getErrorMessage } from "@/lib/error";
import { useInvalidateDocuments } from "@/hooks/queries/useInvalidateDocuments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteDocumentDialogProps {
  readonly open: boolean;
  readonly document: Document | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const DeleteDocumentDialog = ({
  open,
  document: doc,
  onClose,
  onSuccess,
}: DeleteDocumentDialogProps) => {
  const { t } = useTranslation();
  const invalidate = useInvalidateDocuments();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleDelete = async () => {
    if (deleting || !doc) return;
    setError("");
    setDeleting(true);

    try {
      await deleteDocument(doc.id);
      handleClose();
      void invalidate.invalidateList();
      onSuccess?.();
    } catch (err) {
      setError(
        getErrorMessage(err) ?? t("archives.errors.deleteFailed"),
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("archives.delete")}</DialogTitle>
          <DialogDescription>
            {t("archives.deleteConfirm", { name: doc.name })}
            {doc.subDocumentCount > 0 && (
              <span className="mt-2 block text-muted-foreground">
                {t("archives.deleteSubDocumentsHint")}
              </span>
            )}
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

export default DeleteDocumentDialog;
