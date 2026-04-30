import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Member } from "@/api/members";
import { deleteMember } from "@/api/members";
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

interface DeleteMemberDialogProps {
  readonly open: boolean;
  readonly member: Member | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const DeleteMemberDialog = ({
  open,
  member,
  onClose,
  onSuccess,
}: DeleteMemberDialogProps) => {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleDelete = async () => {
    if (deleting || !member) return;
    setError("");
    setDeleting(true);

    try {
      await deleteMember(member.id);
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("members.errors.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("members.delete")}</DialogTitle>
          <DialogDescription>
            {t("members.deleteConfirm", { username: member.username })}
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

export default DeleteMemberDialog;
