import { useState } from "react";
import { useTranslation } from "react-i18next";
import { deleteBook, type Book } from "@/api/books";
import { getErrorMessage } from "@/lib/error";
import { useInvalidateBooks } from "@/hooks/queries/useInvalidateBooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteBookDialogProps {
  readonly open: boolean;
  readonly book: Book | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const DeleteBookDialog = ({
  open,
  book,
  onClose,
  onSuccess,
}: DeleteBookDialogProps) => {
  const { t } = useTranslation();
  const invalidate = useInvalidateBooks();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleDelete = async () => {
    if (deleting || !book) return;
    setError("");
    setDeleting(true);

    try {
      await deleteBook(book.id);
      handleClose();
      void invalidate.invalidateList();
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("books.errors.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("books.deleteBook")}</DialogTitle>
          <DialogDescription>
            {book?.serialized && book.childCount > 0
              ? t("books.deleteSeriesConfirm", {
                  title: book.title,
                  count: book.childCount,
                })
              : t("books.deleteConfirm", { title: book?.title ?? "" })}
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
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            {deleting ? t("common.deleting") : t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteBookDialog;
