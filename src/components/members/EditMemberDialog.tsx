import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { CopyIcon, RefreshCwIcon } from "lucide-react";
import type { Member } from "@/api/members";
import { updateMember } from "@/api/members";
import type { Role } from "@/api/roles";
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

interface EditMemberDialogProps {
  readonly open: boolean;
  readonly member: Member | null;
  readonly roles: Role[];
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const EditMemberDialog = ({
  open,
  member,
  roles,
  onClose,
  onSuccess,
}: EditMemberDialogProps) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [resetPassword, setResetPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [prevMemberId, setPrevMemberId] = useState(member?.id);
  if (member?.id !== prevMemberId) {
    setPrevMemberId(member?.id);
    if (member) {
      setDisplayName(member.displayName ?? "");
      setRoleName(member.roleName);
    }
    setResetPassword(false);
    setPassword("");
    setAutoGenerate(false);
    setError("");
  }

  const handleClose = () => {
    setError("");
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
    if (submitting || !member) return;
    setError("");
    setSubmitting(true);

    try {
      await updateMember(member.id, {
        displayName,
        roleName,
        ...(resetPassword && password ? { password } : {}),
      });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("members.errors.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("members.edit")}</DialogTitle>
          <DialogDescription>
            {t("members.editDescription", { username: member.username })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-displayName">
              {t("members.form.displayName")}
            </Label>
            <Input
              id="edit-displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("members.form.displayNamePlaceholder")}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-role">{t("members.form.role")}</Label>
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
            <label className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={resetPassword}
                onCheckedChange={(checked: boolean) => {
                  setResetPassword(checked);
                  if (!checked) {
                    setPassword("");
                    setAutoGenerate(false);
                  }
                }}
              />
              {t("members.form.resetPassword")}
            </label>
            {resetPassword && (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-password">
                    {t("members.form.newPassword")}
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
                    id="edit-password"
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
              </>
            )}
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

export default EditMemberDialog;
