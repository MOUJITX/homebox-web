import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon, UploadIcon } from "lucide-react";
import type { Platform } from "@/api/platforms";
import {
  createPlatform,
  updatePlatform,
  deletePlatform,
} from "@/api/platforms";
import type { FileRecord } from "@/api/files";
import { usePlatforms } from "@/hooks/queries/usePlatforms";
import { getErrorMessage } from "@/lib/error";
import { useQueryClient } from "@tanstack/react-query";
import { subscriptionKeys } from "@/hooks/queries/subscriptionKeys";
import AuthImg from "@/components/AuthImg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FilePickerDialog from "@/components/shared/FilePickerDialog";

interface PlatformManagerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

const PlatformManagerDialog = ({
  open,
  onClose,
}: PlatformManagerDialogProps) => {
  const { t } = useTranslation();
  const { data: platforms = [] } = usePlatforms();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logoFileId, setLogoFileId] = useState<number | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<Platform | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const invalidatePlatforms = () => {
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.platforms });
  };

  const handleLogoSelect = (files: FileRecord[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setLogoFileId(file.id);
    setLogoPreview(file.url);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await createPlatform({
        name: name.trim(),
        website: website.trim() || undefined,
        logoFileId: logoFileId ?? undefined,
      });
      resetForm();
      invalidatePlatforms();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing || !name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await updatePlatform(editing.id, {
        name: name.trim(),
        website: website.trim() || undefined,
        logoFileId: logoFileId ?? undefined,
      });
      setEditing(null);
      resetForm();
      invalidatePlatforms();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setWebsite("");
    setLogoFileId(null);
    setLogoPreview(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePlatform(id);
      invalidatePlatforms();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("common.error"));
    }
  };

  const handleEdit = (p: Platform) => {
    setEditing(p);
    setName(p.name);
    setWebsite(p.website ?? "");
    setLogoFileId(null);
    setLogoPreview(p.logoUrl);
  };

  const handleCancel = () => {
    setEditing(null);
    resetForm();
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("platforms.title")}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>{t("platforms.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("platforms.name")}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("platforms.website")}</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("platforms.logo")}</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPickerOpen(true)}
              >
                <UploadIcon className="size-3.5" />
                {t("platforms.logo")}
              </Button>
              {logoPreview && (
                <div className="size-8 shrink-0 overflow-hidden rounded border">
                  <img
                    src={logoPreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={editing ? handleUpdate : handleCreate}
            disabled={submitting || !name.trim()}
          >
            {editing ? (
              <PencilIcon className="size-3.5" />
            ) : (
              <PlusIcon className="size-3.5" />
            )}
            {editing ? t("common.save") : t("platforms.create")}
          </Button>
          {editing && (
            <Button variant="outline" onClick={handleCancel}>
              {t("common.cancel")}
            </Button>
          )}
        </div>

        <div className="border-t pt-3 max-h-48 overflow-y-auto">
          {platforms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("common.noResults")}
            </p>
          ) : (
            <div className="space-y-1">
              {platforms.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {p.logoUrl ? (
                      <div className="size-6 shrink-0 overflow-hidden rounded">
                        <AuthImg
                          url={p.logoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="size-6 shrink-0 rounded bg-muted" />
                    )}
                    <span className="truncate">{p.name}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleEdit(p)}
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => void handleDelete(p.id)}
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    <FilePickerDialog
      open={pickerOpen}
      onClose={() => setPickerOpen(false)}
      onSelect={handleLogoSelect}
      multiple={false}
      accept="image/*"
    />
    </>
  );
};

export default PlatformManagerDialog;
