import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Role } from "@/api/roles";
import { updateRole } from "@/api/roles";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditRoleDialogProps {
  readonly open: boolean;
  readonly role: Role | null;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const EditRoleDialog = ({
  open,
  role,
  onClose,
  onSuccess,
}: EditRoleDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [prevRoleId, setPrevRoleId] = useState(role?.id);
  if (role?.id !== prevRoleId) {
    setPrevRoleId(role?.id);
    if (role) {
      setName(role.name);
      setDescription(role.description ?? "");
    }
    setError("");
  }

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !role) return;
    setError("");
    setSubmitting(true);

    try {
      await updateRole(role.id, { name, description });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("roles.errors.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("roles.edit")}</DialogTitle>
          <DialogDescription>
            {t("roles.editDescription", { name: role.name })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-role-name">{t("roles.form.name")}</Label>
            <Input
              id="edit-role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("roles.form.namePlaceholder")}
              required
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-role-description">
              {t("roles.form.description")}
            </Label>
            <Input
              id="edit-role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("roles.form.descriptionPlaceholder")}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoleDialog;
