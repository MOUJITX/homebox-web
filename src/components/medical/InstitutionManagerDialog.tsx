import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  getInstitutions,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  type MedicalInstitution,
} from "@/api/institutions";
import { getErrorMessage } from "@/lib/error";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  onClose: () => void;
  onInstitutionsChange?: (institutions: MedicalInstitution[]) => void;
}

const InstitutionManagerDialog = ({ open, onClose, onInstitutionsChange }: Props) => {
  const { t } = useTranslation();
  const [institutions, setInstitutions] = useState<MedicalInstitution[]>([]);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<MedicalInstitution | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await getInstitutions();
      setInstitutions(data);
      onInstitutionsChange?.(data);
    } catch {}
  };

  useEffect(() => {
    if (open) void fetchData();
  }, [open]);

  const resetForm = () => { setName(""); setNote(""); };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSubmitting(true); setError("");
    try {
      await createInstitution({ name: name.trim(), note: note.trim() || undefined });
      resetForm(); void fetchData();
    } catch (err) { setError(getErrorMessage(err) ?? t("common.error")); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!editing || !name.trim()) return;
    setSubmitting(true); setError("");
    try {
      await updateInstitution(editing.id, { name: name.trim(), note: note.trim() || undefined });
      setEditing(null); resetForm(); void fetchData();
    } catch (err) { setError(getErrorMessage(err) ?? t("common.error")); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteInstitution(id); void fetchData(); }
    catch (err) { setError(getErrorMessage(err) ?? t("common.error")); }
  };

  const handleEdit = (inst: MedicalInstitution) => {
    setEditing(inst);
    setName(inst.name);
    setNote(inst.note ?? "");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("medical.institutions")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium">{t("medical.form.institutionName")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("medical.form.institutionNamePlaceholder")} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium">{t("medical.form.note")}</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={editing ? handleUpdate : handleCreate} disabled={submitting || !name.trim()}>
            {editing ? <PencilIcon className="size-3.5" /> : <PlusIcon className="size-3.5" />}
            {editing ? t("common.save") : t("medical.createInstitution")}
          </Button>
          {editing && <Button variant="outline" onClick={() => { setEditing(null); resetForm(); }}>{t("common.cancel")}</Button>}
        </div>

        <div className="border-t pt-3 max-h-48 overflow-y-auto">
          {institutions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("common.noResults")}</p>
          ) : (
            <div className="space-y-1">
              {institutions.map((inst) => (
                <div key={inst.id} className="flex items-center gap-2 justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="truncate">{inst.name}</span>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(inst)} title={t("common.edit")}><PencilIcon className="size-3.5" /></Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => void handleDelete(inst.id)} title={t("common.delete")}><TrashIcon className="size-3.5" /></Button>
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

export default InstitutionManagerDialog;
