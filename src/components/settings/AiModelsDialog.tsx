import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PencilIcon, TrashIcon, PlusIcon } from "lucide-react";
import type { AiModel } from "@/api/systemConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AiModelsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly models: readonly AiModel[];
  readonly onSave: (models: AiModel[]) => Promise<void>;
}

const emptyForm = (): Omit<AiModel, "id"> => ({
  name: "",
  apiUrl: "",
  apiKey: "",
  model: "",
});

const AiModelsDialog = ({ open, onOpenChange, models, onSave }: AiModelsDialogProps) => {
  const { t } = useTranslation();
  const [localModels, setLocalModels] = useState<AiModel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<AiModel, "id">>(emptyForm());
  const [saving, setSaving] = useState(false);

  // Sync local state when dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setLocalModels([...models]);
      setEditingId(null);
      setForm(emptyForm());
    }
    onOpenChange(nextOpen);
  };

  const handleFieldChange = (field: keyof Omit<AiModel, "id">, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    if (!form.name.trim() || !form.apiUrl.trim() || !form.model.trim()) return;
    const newModel: AiModel = {
      id: crypto.randomUUID(),
      ...form,
    };
    setLocalModels((prev) => [...prev, newModel]);
    setForm(emptyForm());
  };

  const handleEdit = (model: AiModel) => {
    setEditingId(model.id);
    setForm({ name: model.name, apiUrl: model.apiUrl, apiKey: model.apiKey, model: model.model });
  };

  const handleUpdate = () => {
    if (!editingId || !form.name.trim() || !form.apiUrl.trim() || !form.model.trim()) return;
    setLocalModels((prev) =>
      prev.map((m) => (m.id === editingId ? { id: editingId, ...form } : m)),
    );
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleDelete = (id: string) => {
    setLocalModels((prev) => prev.filter((m) => m.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm());
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(localModels);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = form.name.trim() && form.apiUrl.trim() && form.model.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>{t("settings.ai.models.title")}</DialogTitle>
          <DialogDescription>{t("settings.ai.models.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Models table */}
          {localModels.length > 0 && (
            <div className="max-h-60 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("settings.ai.models.columns.name")}</TableHead>
                    <TableHead>{t("settings.ai.models.columns.apiUrl")}</TableHead>
                    <TableHead>{t("settings.ai.models.columns.model")}</TableHead>
                    <TableHead className="w-20">{t("settings.ai.models.columns.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localModels.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="max-w-32 truncate">{m.apiUrl}</TableCell>
                      <TableCell>{m.model}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleEdit(m)}
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDelete(m.id)}
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
          )}

          {/* Add/Edit form */}
          <div className="grid gap-3 rounded-md border p-3">
            <p className="text-sm font-medium">
              {editingId
                ? t("settings.ai.models.editModel")
                : t("settings.ai.models.addModel")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ai-model-name">{t("settings.ai.models.fields.name")}</Label>
                <Input
                  id="ai-model-name"
                  value={form.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder={t("settings.ai.models.placeholders.name")}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ai-model-model">{t("settings.ai.models.fields.model")}</Label>
                <Input
                  id="ai-model-model"
                  value={form.model}
                  onChange={(e) => handleFieldChange("model", e.target.value)}
                  placeholder={t("settings.ai.models.placeholders.model")}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ai-model-api-url">{t("settings.ai.models.fields.apiUrl")}</Label>
              <Input
                id="ai-model-api-url"
                value={form.apiUrl}
                onChange={(e) => handleFieldChange("apiUrl", e.target.value)}
                placeholder={t("settings.ai.models.placeholders.apiUrl")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ai-model-api-key">{t("settings.ai.models.fields.apiKey")}</Label>
              <Input
                id="ai-model-api-key"
                type="password"
                value={form.apiKey}
                onChange={(e) => handleFieldChange("apiKey", e.target.value)}
                placeholder={t("settings.ai.models.placeholders.apiKey")}
              />
            </div>
            <div className="flex gap-2">
              {editingId ? (
                <>
                  <Button type="button" size="sm" onClick={handleUpdate} disabled={!isFormValid}>
                    {t("common.save")}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={handleCancelEdit}>
                    {t("common.cancel")}
                  </Button>
                </>
              ) : (
                <Button type="button" size="sm" onClick={handleAdd} disabled={!isFormValid}>
                  <PlusIcon className="size-3.5" />
                  {t("settings.ai.models.add")}
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiModelsDialog;
