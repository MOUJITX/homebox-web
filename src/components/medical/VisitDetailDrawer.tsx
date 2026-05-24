import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PencilIcon, TrashIcon, PlusIcon, LinkIcon, UploadIcon, FileIcon, DownloadIcon, EyeIcon, ReceiptTextIcon, PillIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getVisitRecordById,
  getExaminations, deleteExamination,
  getLabTests, deleteLabTest,
  getPrescriptions, deletePrescription,
  addPrescriptionItem, deletePrescriptionItem,
  getVisitAttachments, uploadVisitAttachment, deleteVisitAttachment,
  getVisitInvoices, bindVisitInvoice, unbindVisitInvoice,
  type VisitRecord, type VisitExamination, type VisitLabTest,
  type VisitPrescription, type VisitInvoice, type VisitAttachment,
  type VisitSourceType,
} from "@/api/medical";
import { formatFileSize } from "@/lib/utils";
import AttachmentManager, { type AttachmentItem } from "@/components/shared/AttachmentManager";
import InvoiceBindingManager, { type BoundInvoice } from "@/components/shared/InvoiceBindingManager";
import CreateExaminationDialog from "./CreateExaminationDialog";
import CreateLabTestDialog from "./CreateLabTestDialog";
import CreatePrescriptionDialog from "./CreatePrescriptionDialog";
import CreatePrescriptionItemDialog from "./CreatePrescriptionItemDialog";
import BindVisitInvoiceDialog from "./BindVisitInvoiceDialog";
import CreateInvoiceDialog from "@/components/invoices/CreateInvoiceDialog";
import InvoiceDetailDrawer from "@/components/invoices/InvoiceDetailDrawer";

interface Props {
  open: boolean;
  visitId: number | null;
  onClose: () => void;
  onEdit: (record: VisitRecord) => void;
  onDelete: (record: VisitRecord) => void;
  onRefresh: () => void;
}

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="grid gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm">{value ?? "—"}</span>
  </div>
);

const VisitDetailDrawer = ({ open, visitId, onClose, onEdit, onDelete, onRefresh }: Props) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subUploadTarget, setSubUploadTarget] = useState<{ sourceType: VisitSourceType; sourceId: number } | null>(null);
  const [record, setRecord] = useState<VisitRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [examinations, setExaminations] = useState<VisitExamination[]>([]);
  const [labTests, setLabTests] = useState<VisitLabTest[]>([]);
  const [prescriptions, setPrescriptions] = useState<VisitPrescription[]>([]);
  const [attachments, setAttachments] = useState<VisitAttachment[]>([]);
  const [visitInvoices, setVisitInvoices] = useState<VisitInvoice[]>([]);

  const [examOpen, setExamOpen] = useState(false);
  const [examEditing, setExamEditing] = useState<VisitExamination | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testEditing, setTestEditing] = useState<VisitLabTest | null>(null);
  const [prescOpen, setPrescOpen] = useState(false);
  const [prescEditing, setPrescEditing] = useState<VisitPrescription | null>(null);
  const [itemAddPrescId, setItemAddPrescId] = useState<number | null>(null);
  const [invoiceBind, setInvoiceBind] = useState<{ sourceType: VisitSourceType; sourceId: number } | null>(null);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<number | null>(null);
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!visitId) return;
    setLoading(true); setError(false);
    try {
      const [{ data: r }, { data: exams }, { data: tests }, { data: prescs }, { data: atts }, { data: invs }] = await Promise.all([
        getVisitRecordById(visitId),
        getExaminations(visitId, 0, 50),
        getLabTests(visitId, 0, 50),
        getPrescriptions(visitId, 0, 50),
        getVisitAttachments(visitId),
        getVisitInvoices(visitId),
      ]);
      setRecord(r);
      setExaminations(exams.content);
      setLabTests(tests.content);
      setPrescriptions(prescs.content);
      setAttachments(atts);
      setVisitInvoices(invs);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [visitId]);

  useEffect(() => {
    if (open && visitId) void fetchDetail();
    if (!open) { setRecord(null); setError(false); }
  }, [open, visitId, fetchDetail]);

  // ── Targeted updates to avoid full re-fetch ──

  const handleSubAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !subUploadTarget || !visitId) return;
    try {
      const { data } = await uploadVisitAttachment(visitId, file, subUploadTarget.sourceType, subUploadTarget.sourceId);
      setAttachments((prev) => [...prev, data]);
    } catch {}
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVisitAttachmentUpload = async (file: File) => {
    if (!visitId) return;
    const { data } = await uploadVisitAttachment(visitId, file, "RECORD", visitId);
    setAttachments((prev) => [...prev, data]);
  };

  const handleVisitAttachmentDelete = async (id: number) => {
    await deleteVisitAttachment(id);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleInvoiceBindAction = async (invoiceId: number) => {
    if (!invoiceBind || !visitId) return;
    const { data } = await bindVisitInvoice(visitId, invoiceId, invoiceBind.sourceType, invoiceBind.sourceId);
    setVisitInvoices((prev) => [...prev, data]);
  };

  const handleInvoiceUnbind = async (id: number) => {
    await unbindVisitInvoice(id);
    setVisitInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  const handleExamDelete = async (id: number) => {
    await deleteExamination(id);
    setExaminations((prev) => prev.filter((e) => e.id !== id));
  };

  const handleTestDelete = async (id: number) => {
    await deleteLabTest(id);
    setLabTests((prev) => prev.filter((e) => e.id !== id));
  };

  const handlePrescDelete = async (id: number) => {
    await deletePrescription(id);
    setPrescriptions((prev) => prev.filter((e) => e.id !== id));
  };

  const handlePrescItemAdd = async (data: { medicationReminderId: number; note?: string }) => {
    if (!itemAddPrescId) return;
    await addPrescriptionItem(itemAddPrescId, data);
    // refetch prescriptions to get updated items
    if (visitId) {
      const { data: prescs } = await getPrescriptions(visitId, 0, 50);
      setPrescriptions(prescs.content);
    }
  };

  const handlePrescItemDelete = async (itemId: number) => {
    await deletePrescriptionItem(itemId);
    if (visitId) {
      const { data: prescs } = await getPrescriptions(visitId, 0, 50);
      setPrescriptions(prescs.content);
    }
  };

  const isInpatient = record?.visitType === "INPATIENT";

  const getSubAttachments = (type: VisitSourceType, id: number) =>
    attachments.filter((a) => a.sourceType === type && a.sourceId === id);

  const getSubInvoices = (type: VisitSourceType, id: number) =>
    visitInvoices.filter((i) => i.sourceType === type && i.sourceId === id);

  const renderSubRecordItem = (
    data: VisitExamination | VisitLabTest | VisitPrescription,
    type: VisitSourceType,
    name: string,
    date: string | null,
    desc: string | null,
    onEdit: () => void,
    onDeleteItem: () => void,
    extraContent?: React.ReactNode,
    onAddItem?: () => void,
  ) => {
    const subAtts = getSubAttachments(type, data.id);
    const subInvs = getSubInvoices(type, data.id);
    return (
      <div className="rounded-md border">
        <div className="flex items-start justify-between px-3 py-2 text-sm">
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{name}</div>
            {(date || desc) && (
              <div className="text-xs text-muted-foreground">
                {date}{date && desc ? " · " : ""}{desc}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {onAddItem && (
              <Button variant="ghost" size="icon-xs" onClick={onAddItem} title={t("medical.addItem")}>
                <PlusIcon className="size-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon-xs" onClick={() => { setSubUploadTarget({ sourceType: type, sourceId: data.id }); fileInputRef.current?.click(); }} title={t("medical.uploadAttachment")}>
              <UploadIcon className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => setInvoiceBind({ sourceType: type, sourceId: data.id })} title={t("medical.bindInvoice")}>
              <LinkIcon className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onEdit} title={t("common.edit")}>
              <PencilIcon className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onDeleteItem} title={t("common.delete")}>
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        </div>
        {extraContent}
        {(subAtts.length > 0 || subInvs.length > 0) && (
          <div className="border-t px-3 py-2 space-y-1.5">
            {subAtts.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-xs">
                <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{a.originalFilename}</span>
                <span className="text-muted-foreground shrink-0">{formatFileSize(a.fileSize)}</span>
                {a.url && (
                  <a href={a.url} download={a.originalFilename}>
                    <Button variant="ghost" size="icon-xs" type="button" title={t("common.download")}>
                      <DownloadIcon className="size-3.5" />
                    </Button>
                  </a>
                )}
                <Button variant="ghost" size="icon-xs" onClick={() => handleVisitAttachmentDelete(a.id)} title={t("common.delete")}>
                  <TrashIcon className="size-3.5" />
                </Button>
              </div>
            ))}
            {subInvs.map((inv) => (
              <div key={inv.id} className="flex items-center gap-2 text-xs">
                <ReceiptTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{t("medical.invoiceLabel")}: {inv.invoiceNumber ?? `#${inv.invoiceId}`}</span>
                <span className="text-muted-foreground shrink-0">{inv.totalAmount}</span>
                <Button variant="ghost" size="icon-xs" onClick={() => { setViewingInvoiceId(inv.invoiceId); setInvoiceDrawerOpen(true); }} title={t("common.view")}>
                  <EyeIcon className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => handleInvoiceUnbind(inv.id)} title={t("common.unbind")}>
                  <TrashIcon className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleSubAttachmentUpload} />

        <SheetHeader className="shrink-0">
          <SheetTitle className="truncate">{record?.patientName ?? t("medical.title")}</SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-muted-foreground">{t("common.loading")}</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-destructive">{t("medical.errors.loadFailed")}</span>
          </div>
        )}

        {!loading && record && (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isInpatient ? "default" : "secondary"}>
                {isInpatient ? t("medical.visitType.INPATIENT") : t("medical.visitType.OUTPATIENT")}
              </Badge>
              {record.patientGender && <Badge variant="outline">{t(`medical.gender.${record.patientGender}`)}</Badge>}
              {record.patientAge != null && <span className="text-xs text-muted-foreground">{record.patientAge}{t("medical.age")}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t("medical.form.institution")} value={record.institutionName} />
              <Field label={t("medical.form.doctor")} value={record.doctor} />
              <Field label={isInpatient ? t("medical.form.admissionDept") : t("medical.form.department")} value={record.department} />
              <Field label={isInpatient ? t("medical.form.admissionDate") : t("medical.form.visitDate")} value={record.visitDate} />
              {isInpatient && (
                <>
                  <Field label={t("medical.form.dischargeDept")} value={record.dischargeDept} />
                  <Field label={t("medical.form.dischargeDate")} value={record.dischargeDate} />
                </>
              )}
            </div>

            {record.medicalContent && (
              <div className="grid gap-1">
                <span className="text-xs text-muted-foreground">{t("medical.form.medicalContent")}</span>
                <span className="text-sm whitespace-pre-wrap">{record.medicalContent}</span>
              </div>
            )}

            <div className="grid gap-2">
              <AttachmentManager
                attachments={attachments.filter((a) => a.sourceType === "RECORD").map((a) => ({ id: a.id, filename: a.originalFilename, fileSize: a.fileSize, url: a.url } satisfies AttachmentItem))}
                uploadLabel={t("medical.uploadAttachment")}
                emptyLabel={t("medical.noAttachments")}
                onUpload={handleVisitAttachmentUpload}
                onDelete={handleVisitAttachmentDelete}
              />
            </div>

            <div className="grid gap-2">
              <InvoiceBindingManager
                invoices={visitInvoices.filter((i) => i.sourceType === "RECORD").map((inv) => ({
                  id: inv.id, invoiceId: inv.invoiceId, invoiceNumber: inv.invoiceNumber,
                  invoiceDate: inv.invoiceDate, totalAmount: inv.totalAmount,
                } satisfies BoundInvoice))}
                title={t("medical.invoices")}
                bindLabel={t("medical.bindInvoice")}
                uploadNewLabel={t("medical.uploadNewInvoice")}
                emptyLabel={t("medical.noInvoices")}
                onBind={() => setInvoiceBind({ sourceType: "RECORD", sourceId: visitId! })}
                onCreateNew={() => setCreateInvoiceOpen(true)}
                onUnbind={handleInvoiceUnbind}
                onView={(invoiceId) => { setViewingInvoiceId(invoiceId); setInvoiceDrawerOpen(true); }}
              />
            </div>


            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {t("medical.examinations")}
                  <span className="text-xs text-muted-foreground ml-1">({examinations.length})</span>
                </h4>
                <Button variant="outline" size="sm" onClick={() => setExamOpen(true)}>
                  <PlusIcon className="size-3.5" /> {t("medical.addExamination")}
                </Button>
              </div>
              {examinations.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4">
                  <p className="text-sm text-muted-foreground text-center py-4">{t("medical.noExaminations")}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {examinations.map((e) => renderSubRecordItem(e, "EXAMINATION", e.name, e.examDate, e.description, () => setExamEditing(e), () => handleExamDelete(e.id)))}
                </div>
              )}
            </div>


            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {t("medical.labTests")}
                  <span className="text-xs text-muted-foreground ml-1">({labTests.length})</span>
                </h4>
                <Button variant="outline" size="sm" onClick={() => setTestOpen(true)}>
                  <PlusIcon className="size-3.5" /> {t("medical.addLabTest")}
                </Button>
              </div>
              {labTests.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4">
                  <p className="text-sm text-muted-foreground text-center py-4">{t("medical.noLabTests")}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {labTests.map((lt) => renderSubRecordItem(lt, "LAB_TEST", lt.name, lt.testDate, lt.description, () => setTestEditing(lt), () => handleTestDelete(lt.id)))}
                </div>
              )}
            </div>


            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {t("medical.prescriptions")}
                  <span className="text-xs text-muted-foreground ml-1">({prescriptions.length})</span>
                </h4>
                <Button variant="outline" size="sm" onClick={() => setPrescOpen(true)}>
                  <PlusIcon className="size-3.5" /> {t("medical.addPrescription")}
                </Button>
              </div>
              {prescriptions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4">
                  <p className="text-sm text-muted-foreground text-center py-4">{t("medical.noPrescriptions")}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {prescriptions.map((p) => renderSubRecordItem(p, "PRESCRIPTION", p.prescriptionDate || t("medical.prescriptions"), null, p.description, () => setPrescEditing(p), () => handlePrescDelete(p.id),
                    p.items.length > 0 ? (
                      <div className="border-t px-3 py-1.5 space-y-0.5">
                        {p.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-xs">
                            <PillIcon className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="font-medium">{item.medicationName}</span>
                            {item.dosageMethod && <span className="text-muted-foreground">{t("medical.form.dosageMethod")}: {item.dosageMethod}</span>}
                            {item.dosageQuantity && <span className="text-muted-foreground">{item.dosageQuantity}{item.dosageUnit}</span>}
                            {item.note && <span className="text-muted-foreground">({item.note})</span>}
                            <Button variant="ghost" size="icon-xs" className="size-5 ml-auto" onClick={() => handlePrescItemDelete(item.id)} title={t("common.delete")}>
                              <TrashIcon className="size-2.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : undefined,
                    () => setItemAddPrescId(p.id),
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && record && (
          <SheetFooter className="shrink-0">
            <Button variant="outline" onClick={() => onEdit(record)}>
              <PencilIcon className="size-3.5" /> {t("medical.edit")}
            </Button>
            <Button variant="destructive" onClick={() => onDelete(record)}>
              <TrashIcon className="size-3.5" /> {t("medical.delete")}
            </Button>
          </SheetFooter>
        )}

        <CreateExaminationDialog open={examOpen || !!examEditing} visitId={visitId!} initialData={examEditing}
          onClose={() => { setExamOpen(false); setExamEditing(null); }}
          onSuccess={async () => { if (visitId) { const { data } = await getExaminations(visitId, 0, 50); setExaminations(data.content); } onRefresh(); }} />
        <CreateLabTestDialog open={testOpen || !!testEditing} visitId={visitId!} initialData={testEditing}
          onClose={() => { setTestOpen(false); setTestEditing(null); }}
          onSuccess={async () => { if (visitId) { const { data } = await getLabTests(visitId, 0, 50); setLabTests(data.content); } onRefresh(); }} />
        <CreatePrescriptionDialog open={prescOpen || !!prescEditing} visitId={visitId!} initialData={prescEditing}
          onClose={() => { setPrescOpen(false); setPrescEditing(null); }}
          onSuccess={async () => { if (visitId) { const { data } = await getPrescriptions(visitId, 0, 50); setPrescriptions(data.content); } onRefresh(); }} />
        <CreatePrescriptionItemDialog open={itemAddPrescId !== null} onClose={() => setItemAddPrescId(null)} onSubmit={handlePrescItemAdd} />
        <BindVisitInvoiceDialog open={invoiceBind !== null} onClose={() => setInvoiceBind(null)} onBind={handleInvoiceBindAction} onCreateNew={() => setCreateInvoiceOpen(true)} />
        <CreateInvoiceDialog open={createInvoiceOpen} onClose={() => setCreateInvoiceOpen(false)} onSuccess={() => {}}
          onCreated={async (created) => { if (invoiceBind && visitId) { const { data } = await bindVisitInvoice(visitId, created.id, invoiceBind.sourceType, invoiceBind.sourceId); setVisitInvoices((prev) => [...prev, data]); } }} />
        <InvoiceDetailDrawer invoiceId={viewingInvoiceId} open={invoiceDrawerOpen} onClose={() => { setInvoiceDrawerOpen(false); setViewingInvoiceId(null); }} onEdit={() => {}} onDelete={() => {}} onRefresh={() => {}} />
      </SheetContent>
    </Sheet>
  );
};

export default VisitDetailDrawer;
