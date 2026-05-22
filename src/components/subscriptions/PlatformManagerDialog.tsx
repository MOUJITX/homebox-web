import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import type { Platform } from "@/api/platforms";
import { createPlatform, updatePlatform, deletePlatform } from "@/api/platforms";
import { usePlatforms } from "@/hooks/queries/usePlatforms";
import { getErrorMessage } from "@/lib/error";
import { useQueryClient } from "@tanstack/react-query";
import { subscriptionKeys } from "@/hooks/queries/subscriptionKeys";
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
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [editing, setEditing] = useState<Platform | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const invalidatePlatforms = () => {
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.platforms });
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await createPlatform({ name: name.trim(), website: website.trim() || undefined });
      setName("");
      setWebsite("");
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
      await updatePlatform(editing.id, { name: name.trim(), website: website.trim() || undefined });
      setEditing(null);
      setName("");
      setWebsite("");
      invalidatePlatforms();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePlatform(id);
      invalidatePlatforms();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("common.error"));
    }
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={editing ? handleUpdate : handleCreate} disabled={submitting || !name.trim()}>
            {editing ? <PencilIcon className="size-3.5" /> : <PlusIcon className="size-3.5" />}
            {editing ? t("common.save") : t("platforms.create")}
          </Button>
          {editing && (
            <Button variant="outline" onClick={() => { setEditing(null); setName(""); setWebsite(""); }}>
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
                <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="truncate">{p.name}</span>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-xs" onClick={() => { setEditing(p); setName(p.name); setWebsite(p.website ?? ""); }}>
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
