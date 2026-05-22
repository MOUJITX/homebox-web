import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon, UploadIcon } from "lucide-react";
import type { Platform } from "@/api/platforms";
import { createPlatform, updatePlatform, deletePlatform } from "@/api/platforms";
import { uploadFile } from "@/api/files";
import { usePlatforms } from "@/hooks/queries/usePlatforms";
import { getErrorMessage } from "@/lib/error";
import { useQueryClient } from "@tanstack/react-query";
import { subscriptionKeys } from "@/hooks/queries/subscriptionKeys";
import AuthImg from "@/components/AuthImg";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlatformManagerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

const PlatformManagerDialog = ({ open, onClose }: PlatformManagerDialogProps) => {
  const { t } = useTranslation();
  const { data: platforms = [] } = usePlatforms();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logoFileId, setLogoFileId] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editing, setEditing] = useState<Platform | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const invalidatePlatforms = () => {
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.platforms });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { data } = await uploadFile(file);
      setLogoFileId(data.id);
    } catch (err) {
      setError(getErrorMessage(err) ?? t("common.error"));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
  };

  const handleCancel = () => {
    setEditing(null);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("platforms.title")}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>{t("platforms.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("platforms.name")} />
          </div>
          <div className="grid gap-2">
            <Label>{t("platforms.website")}</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
          </div>
          <div className="grid gap-2">
            <Label>{t("platforms.logo")}</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                <UploadIcon className="size-3.5" />
                {uploadingLogo ? "..." : t("platforms.logo")}
              </Button>
              {logoFileId && (
                <span className="text-xs text-muted-foreground">ID: {logoFileId}</span>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={editing ? handleUpdate : handleCreate} disabled={submitting || !name.trim()}>
            {editing ? <PencilIcon className="size-3.5" /> : <PlusIcon className="size-3.5" />}
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
            <p className="text-sm text-muted-foreground text-center py-4">{t("common.noResults")}</p>
          ) : (
            <div className="space-y-1">
              {platforms.map((p) => (
                <div key={p.id} className="flex items-center gap-2 justify-between rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {p.logoUrl ? (
                      <div className="size-6 shrink-0 overflow-hidden rounded">
                        <AuthImg url={p.logoUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="size-6 shrink-0 rounded bg-muted" />
                    )}
                    <span className="truncate">{p.name}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(p)}>
                      <PencilIcon className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => void handleDelete(p.id)}>
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
  );
};

export default PlatformManagerDialog;
