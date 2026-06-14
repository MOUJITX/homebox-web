import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "lucide-react";
import {
  createDocument,
  updateDocument,
  type Document,
  type DocumentDetail,
  type DocumentStatus,
  type Importance,
} from "@/api/documents";
import { getErrorMessage } from "@/lib/error";
import { useDocumentCategories } from "@/hooks/queries/useDocumentCategories";
import { useInvalidateDocuments } from "@/hooks/queries/useInvalidateDocuments";
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
  Select,
  SelectTrigger,
  SelectPopup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import DocumentCategoryManagerDialog from "./DocumentCategoryManagerDialog";

const STATUS_OPTIONS: DocumentStatus[] = [
  "ACTIVE",
  "EXPIRED",
  "REVOKED",
  "LOST",
];

const IMPORTANCE_OPTIONS: Importance[] = ["HIGH", "MEDIUM", "LOW"];

interface DocumentDialogProps {
  readonly open: boolean;
  readonly document?: Document | DocumentDetail | null;
  readonly parentId?: number | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const DocumentDialog = ({
  open,
  document: editDoc = null,
  parentId = null,
  onClose,
  onSuccess,
}: DocumentDialogProps) => {
  const { t } = useTranslation();
  const { data: categories = [] } = useDocumentCategories();
  const invalidate = useInvalidateDocuments();

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [holder, setHolder] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState<DocumentStatus>("ACTIVE");
  const [importance, setImportance] = useState<Importance>("MEDIUM");
  const [reminderDays, setReminderDays] = useState("7");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const isEdit = !!editDoc;

  const resetForm = () => {
    setName("");
    setCategoryId(null);
    setHolder("");
    setDocumentNumber("");
    setIssuer("");
    setIssueDate("");
    setExpiryDate("");
    setStatus("ACTIVE");
    setImportance("MEDIUM");
    setReminderDays("7");
    setNote("");
    setError("");
  };

  const populateForm = (doc: Document | DocumentDetail) => {
    setName(doc.name);
    setCategoryId(doc.categoryId);
    setHolder(doc.holder ?? "");
    setDocumentNumber(doc.documentNumber ?? "");
    setIssuer(doc.issuer ?? "");
    setIssueDate(doc.issueDate ?? "");
    setExpiryDate(doc.expiryDate ?? "");
    setStatus(doc.status);
    setImportance(doc.importance);
    setReminderDays(String(doc.reminderDays));
    setNote(doc.note ?? "");
  };

  const [prevDocId, setPrevDocId] = useState(editDoc?.id);
  if (editDoc?.id !== prevDocId) {
    setPrevDocId(editDoc?.id);
    if (editDoc) {
      populateForm(editDoc);
    } else {
      resetForm();
    }
  }

  const handleClose = () => {
    resetForm();
    setCategoryManagerOpen(false);
    onClose();
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !categoryId) return;
    setError("");
    setSubmitting(true);

    try {
      const base = {
        name,
        categoryId,
        holder: holder || undefined,
        documentNumber: documentNumber || undefined,
        issuer: issuer || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        status,
        importance,
        reminderDays: expiryDate
          ? Number.parseInt(reminderDays, 10) || 7
          : undefined,
        note: note || undefined,
      };

      if (isEdit && editDoc) {
        await updateDocument(editDoc.id, base);
      } else {
        await createDocument({
          ...base,
          parentId: parentId ?? undefined,
        });
      }
      handleClose();
      void invalidate.invalidateList();
      onSuccess?.();
    } catch (err) {
      setError(
        getErrorMessage(err) ??
          t(isEdit ? "archives.errors.updateFailed" : "archives.errors.createFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose();
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit
                ? t("archives.edit")
                : parentId
                  ? t("archives.createSubDocument")
                  : t("archives.create")}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? t("archives.editDescription", { name: editDoc!.name })
                : parentId
                  ? t("archives.createSubDocumentDescription")
                  : t("archives.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="doc-name">{t("archives.form.name")}</Label>
              <Input
                id="doc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("archives.form.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("archives.form.category")}</Label>
              <div className="flex gap-2">
                <Select
                  value={categoryId}
                  onValueChange={(v) =>
                    v !== undefined && setCategoryId(v)
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("archives.form.categoryPlaceholder")}
                    >
                      {() =>
                        categories.find((c) => c.id === categoryId)
                          ?.name ??
                        t("archives.form.categoryPlaceholder")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCategoryManagerOpen(true)}
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="doc-holder">
                  {t("archives.form.holder")}
                </Label>
                <Input
                  id="doc-holder"
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                  placeholder={t("archives.form.holderPlaceholder")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="doc-number">
                  {t("archives.form.documentNumber")}
                </Label>
                <Input
                  id="doc-number"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder={t(
                    "archives.form.documentNumberPlaceholder",
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="doc-issuer">
                  {t("archives.form.issuer")}
                </Label>
                <Input
                  id="doc-issuer"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder={t("archives.form.issuerPlaceholder")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="doc-issue-date">
                  {t("archives.form.issueDate")}
                </Label>
                <Input
                  id="doc-issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="doc-expiry-date">
                  {t("archives.form.expiryDate")}
                </Label>
                <Input
                  id="doc-expiry-date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t("archives.form.expiryDateHint")}
                </p>
              </div>
              {expiryDate && (
                <div className="grid gap-2">
                  <Label htmlFor="doc-reminder-days">
                    {t("archives.form.reminderDays")}
                  </Label>
                  <Input
                    id="doc-reminder-days"
                    type="number"
                    min="1"
                    value={reminderDays}
                    onChange={(e) => setReminderDays(e.target.value)}
                    placeholder="7"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("archives.form.status")}</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as DocumentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {() => t(`archives.status.${status.toLowerCase()}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`archives.status.${s.toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("archives.form.importance")}</Label>
                <Select
                  value={importance}
                  onValueChange={(v) => setImportance(v as Importance)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {() =>
                        t(`archives.importance.${importance.toLowerCase()}`)
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {IMPORTANCE_OPTIONS.map((i) => (
                      <SelectItem key={i} value={i}>
                        {t(`archives.importance.${i.toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doc-note">{t("archives.form.note")}</Label>
              <textarea
                id="doc-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("archives.form.notePlaceholder")}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? isEdit
                    ? t("common.saving")
                    : t("common.creating")
                  : isEdit
                    ? t("common.save")
                    : t("common.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <DocumentCategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />
    </>
  );
};

export default DocumentDialog;
