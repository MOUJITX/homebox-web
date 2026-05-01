import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  getStores,
  createStore,
  updateStore,
  deleteStore,
  type Store,
} from "@/api/stores";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface StoreManagerDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onChanged: () => void;
}

type Mode = "list" | "create" | "edit";

const DEFAULT_CHANNELS = ["Online", "Offline", "Physical Store"];

const StoreManagerDialog = ({
  open,
  onClose,
  onChanged,
}: StoreManagerDialogProps) => {
  const { t } = useTranslation();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("list");
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("");
  const [customChannel, setCustomChannel] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getStores();
      setStores(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void fetchStores();
  }, [open, fetchStores]);

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

  const handleStartEdit = (store: Store) => {
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
      channel === "__custom__" ? customChannel || undefined : channel || undefined;

    try {
      if (mode === "create") {
        await createStore({ name, channel: finalChannel });
      } else if (mode === "edit" && editingStore) {
        await updateStore(editingStore.id, { name, channel: finalChannel });
      }
      resetForm();
      void fetchStores();
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("assets.stores.errors.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (store: Store) => {
    try {
      await deleteStore(store.id);
      void fetchStores();
      onChanged();
    } catch (err) {
      setError(
        getErrorMessage(err) ?? t("assets.stores.errors.deleteFailed"),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("assets.stores.manage")}</DialogTitle>
          <DialogDescription>
            {t("assets.stores.manageDescription")}
          </DialogDescription>
        </DialogHeader>

        {mode === "list" && (
          <div className="grid gap-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={handleStartCreate}>
                <PlusIcon className="size-3.5" />
                {t("assets.stores.create")}
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("assets.stores.columns.name")}</TableHead>
                    <TableHead>{t("assets.stores.columns.channel")}</TableHead>
                    <TableHead className="text-right">
                      {t("assets.stores.columns.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-16 text-center">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && stores.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-16 text-center text-muted-foreground"
                      >
                        {t("common.noResults")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    stores.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.name}
                        </TableCell>
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
                              onClick={() => handleDelete(s)}
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
                {t("assets.stores.form.name")}
              </Label>
              <Input
                id="store-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("assets.stores.form.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="store-channel">
                {t("assets.stores.form.channel")}
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
                    {t("assets.stores.form.customChannel")}
                  </Button>
                </div>
                {channel === "__custom__" && (
                  <Input
                    value={customChannel}
                    onChange={(e) => setCustomChannel(e.target.value)}
                    placeholder={t("assets.stores.form.channelPlaceholder")}
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

export default StoreManagerDialog;
