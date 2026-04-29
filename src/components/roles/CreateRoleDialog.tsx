import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { createRole } from "@/api/roles";
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

interface CreateRoleDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const CreateRoleDialog = ({
  open,
  onClose,
  onSuccess,
}: CreateRoleDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);

    try {
      await createRole({ name, description });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("roles.errors.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("roles.create")}</DialogTitle>
          <DialogDescription>{t("roles.createDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="create-role-name">{t("roles.form.name")}</Label>
            <Input
              id="create-role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("roles.form.namePlaceholder")}
              required
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-role-description">
              {t("roles.form.description")}
            </Label>
            <Input
              id="create-role-description"
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
              {submitting ? t("common.creating") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoleDialog;
