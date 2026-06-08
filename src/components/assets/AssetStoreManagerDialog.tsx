import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  createAssetStore,
  updateAssetStore,
  deleteAssetStore,
  type AssetStore,
} from "@/api/assetStores";
import { getErrorMessage } from "@/lib/error";
import { useAssetStores } from "@/hooks/queries/useAssetStores";
import { useInvalidateAssets } from "@/hooks/queries/useInvalidateAssets";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface AssetStoreManagerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

type Mode = "list" | "create" | "edit";

const DEFAULT_CHANNELS = ["Online", "Offline", "Physical Store"];

const AssetStoreManagerDialog = ({
  open,
  onClose,
}: AssetStoreManagerDialogProps) => {
  const { t } = useTranslation();
  const { data: stores = [], isLoading } = useAssetStores();
  const invalidate = useInvalidateAssets();
  const [mode, setMode] = useState<Mode>("list");
  const [editingStore, setEditingStore] = useState<AssetStore | null>(null);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("");
  const [customChannel, setCustomChannel] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allChannels = Array.from(
    new Set([
      ...DEFAULT_CHANNELS,
      ...stores.map((s) => s.channel).filter((c): c is string => !!c),
    ]),
  );

  const resetForm = () => {
    setName("");
    setChannel("");
    setCustomChannel("");
    setError("");
    setMode("list");
    setEditingStore(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleStartCreate = () => {
    setName("");
    setChannel("");
    setCustomChannel("");
    setError("");
    setMode("create");
  };

  const handleStartEdit = (store: AssetStore) => {
    setEditingStore(store);
    setName(store.name);
    if (store.channel && allChannels.includes(store.channel)) {
      setChannel(store.channel);
      setCustomChannel("");
    } else {
      setChannel("__custom__");
      setCustomChannel(store.channel ?? "");
    }
    setError("");
    setMode("edit");
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);

    const finalChannel =
      channel === "__custom__"
        ? customChannel || undefined
        : channel || undefined;

    try {
      if (mode === "create") {
        await createAssetStore({ name, channel: finalChannel });
      } else if (mode === "edit" && editingStore) {
        await updateAssetStore(editingStore.id, {
          name,
          channel: finalChannel,
        });
      }
      resetForm();
      void invalidate.invalidateStores();
    } catch (err) {
      setError(
        getErrorMessage(err) ?? t("assets.assetStores.errors.saveFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (store: AssetStore) => {
    try {
      await deleteAssetStore(store.id);
      void invalidate.invalidateStores();
    } catch (err) {
      setError(
        getErrorMessage(err) ?? t("assets.assetStores.errors.deleteFailed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("assets.assetStores.manage")}</DialogTitle>
          <DialogDescription>
            {t("assets.assetStores.manageDescription")}
          </DialogDescription>
        </DialogHeader>

        {mode === "list" && (
          <div className="grid gap-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={handleStartCreate}>
                <PlusIcon className="size-3.5" />
                {t("assets.assetStores.create")}
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("assets.assetStores.columns.name")}
                    </TableHead>
                    <TableHead>
                      {t("assets.assetStores.columns.channel")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-16 text-center">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && stores.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-16 text-center text-muted-foreground"
                      >
                        {t("common.noResults")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading &&
                    stores.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.channel || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleStartEdit(s)}
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => void handleDelete(s)}
                            >
                              <TrashIcon className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        )}

        {(mode === "create" || mode === "edit") && (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="store-name">
                {t("assets.assetStores.form.name")}
              </Label>
              <Input
                id="store-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("assets.assetStores.form.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="store-channel">
                {t("assets.assetStores.form.channel")}
              </Label>
              <div className="grid gap-2">
                <div className="flex flex-wrap gap-1">
                  {allChannels.map((ch) => (
                    <Button
                      key={ch}
                      type="button"
                      variant={channel === ch ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setChannel(ch);
                        setCustomChannel("");
                      }}
                    >
                      {ch}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={channel === "__custom__" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChannel("__custom__")}
                  >
                    {t("assets.assetStores.form.customChannel")}
                  </Button>
                </div>
                {channel === "__custom__" && (
                  <Input
                    value={customChannel}
                    onChange={(e) => setCustomChannel(e.target.value)}
                    placeholder={t(
                      "assets.assetStores.form.channelPlaceholder",
                    )}
                  />
                )}
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssetStoreManagerDialog;
