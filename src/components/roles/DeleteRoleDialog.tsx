import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Role } from "@/api/roles";
import { deleteRole } from "@/api/roles";
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

interface DeleteRoleDialogProps {
  readonly open: boolean;
  readonly role: Role | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const DeleteRoleDialog = ({
  open,
  role,
  onClose,
  onSuccess,
}: DeleteRoleDialogProps) => {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleDelete = async () => {
    if (deleting || !role) return;
    setError("");
    setDeleting(true);

    try {
      await deleteRole(role.id);
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("roles.errors.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("roles.delete")}</DialogTitle>
          <DialogDescription>
            {t("roles.deleteConfirm", { name: role.name })}
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

export default DeleteRoleDialog;
