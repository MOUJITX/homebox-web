import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { CopyIcon, RefreshCwIcon } from "lucide-react";
import type { Role } from "@/api/roles";
import { createMember } from "@/api/members";
import { getErrorMessage } from "@/lib/error";
import { generatePassword } from "@/lib/password";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectPopup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface CreateMemberDialogProps {
  readonly open: boolean;
  readonly roles: Role[];
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const CreateMemberDialog = ({
  open,
  roles,
  onClose,
  onSuccess,
}: CreateMemberDialogProps) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setDisplayName("");
    setRoleName("");
    setAutoGenerate(false);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGenerateToggle = (checked: boolean) => {
    setAutoGenerate(checked);
    if (checked) {
      setPassword(generatePassword());
    } else {
      setPassword("");
    }
  };

  const handleRegenerate = () => {
    setPassword(generatePassword());
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(password);
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);

    try {
      await createMember({ username, password, displayName, roleName });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("members.errors.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("members.create")}</DialogTitle>
          <DialogDescription>{t("members.createDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="create-username">{t("members.form.username")}</Label>
            <Input
              id="create-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("members.form.usernamePlaceholder")}
              required
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-displayName">
              {t("members.form.displayName")}
            </Label>
            <Input
              id="create-displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("members.form.displayNamePlaceholder")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-role">{t("members.form.role")}</Label>
            <Select value={roleName} onValueChange={(v) => v && setRoleName(v)} required>
              <SelectTrigger>
                <SelectValue placeholder={t("members.form.rolePlaceholder")} />
              </SelectTrigger>
              <SelectPopup>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="create-password">
                {t("members.form.password")}
              </Label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Checkbox
                  checked={autoGenerate}
                  onCheckedChange={handleGenerateToggle}
                />
                {t("members.form.autoGenerate")}
              </label>
            </div>
            <div className="flex gap-1.5">
              <Input
                id="create-password"
                type={autoGenerate ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("members.form.passwordPlaceholder")}
                required
                readOnly={autoGenerate}
              />
              {autoGenerate && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRegenerate}
                  >
                    <RefreshCwIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPassword}
                  >
                    <CopyIcon className="size-4" />
                  </Button>
                </>
              )}
            </div>
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

export default CreateMemberDialog;
