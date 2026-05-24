import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PencilIcon, TrashIcon, PlusIcon, LinkIcon } from "lucide-react";
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
  type VisitPrescription, type VisitInvoice,
  type VisitSourceType,
} from "@/api/medical";
import AttachmentManager, { type AttachmentItem } from "@/components/shared/AttachmentManager";
import InvoiceBindingManager, { type BoundInvoice } from "@/components/shared/InvoiceBindingManager";
import CreateExaminationDialog from "./CreateExaminationDialog";
import CreateLabTestDialog from "./CreateLabTestDialog";
import CreatePrescriptionDialog from "./CreatePrescriptionDialog";
import CreatePrescriptionItemDialog from "./CreatePrescriptionItemDialog";
import BindVisitInvoiceDialog from "./BindVisitInvoiceDialog";
import CreateInvoiceDialog from "@/components/invoices/CreateInvoiceDialog";
import type { InvoiceDetail } from "@/api/invoices";

interface Props {
  open: boolean;
  visitId: number | null;
  onClose: () => void;
  onEdit: (record: VisitRecord) => void;
  onDelete: (record: VisitRecord) => void;
  onRefresh: () => void;
}

const Field = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="grid gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm">{value ?? "—"}</span>
  </div>
);

const VisitDetailDrawer = ({ open, visitId, onClose, onEdit, onDelete, onRefresh }: Props) => {
  const { t } = useTranslation();
  const [record, setRecord] = useState<VisitRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [examinations, setExaminations] = useState<VisitExamination[]>([]);
  const [labTests, setLabTests] = useState<VisitLabTest[]>([]);
  const [prescriptions, setPrescriptions] = useState<VisitPrescription[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
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
      setAttachments(atts.map((a) => ({ id: a.id, filename: a.originalFilename, fileSize: a.fileSize, url: a.url } satisfies AttachmentItem)));
      setVisitInvoices(invs);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [visitId]);

  useEffect(() => {
    if (open && visitId) void fetchDetail();
    if (!open) { setRecord(null); setError(false); }
  }, [open, visitId, fetchDetail]);

  const handleInvoiceBindAction = async (invoiceId: number) => {
    if (!invoiceBind || !visitId) return;
    await bindVisitInvoice(visitId, invoiceId, invoiceBind.sourceType, invoiceBind.sourceId);
    void fetchDetail();
  };

  const isInpatient = record?.visitType === "INPATIENT";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
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
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isInpatient ? "default" : "secondary"}>
                {isInpatient ? t("medical.visitType.INPATIENT") : t("medical.visitType.OUTPATIENT")}
              </Badge>
              {record.patientGender && <Badge variant="outline">{t(`medical.gender.${record.patientGender}`)}</Badge>}
              {record.patientAge != null && <span className="text-xs text-muted-foreground">{record.patientAge}{t("medical.age")}</span>}
            </div>

            {/* Basic info */}
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

            {/* Medical content */}
            {record.medicalContent && (
              <div className="grid gap-1">
                <span className="text-xs text-muted-foreground">{t("medical.form.medicalContent")}</span>
                <span className="text-sm whitespace-pre-wrap">{record.medicalContent}</span>
              </div>
            )}

            {/* Attachments */}
            <AttachmentManager
              attachments={attachments}
              uploadLabel={t("medical.uploadAttachment")}
              emptyLabel={t("medical.noAttachments")}
              onUpload={async (file) => { if (visitId) { await uploadVisitAttachment(visitId, file, "RECORD", visitId); void fetchDetail(); } }}
              onDelete={async (id) => { await deleteVisitAttachment(id); void fetchDetail(); }}
              getDownloadUrl={(a) => a.url}
            />

            {/* Invoices */}
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
              onUnbind={async (id) => { await unbindVisitInvoice(id); void fetchDetail(); }}
              onView={(invoiceId) => { window.open(`/invoices?invoiceId=${invoiceId}`, "_blank"); }}
            />

            {/* Examinations */}
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
                  {examinations.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{e.name}</div>
                        {(e.examDate || e.description) && (
                          <div className="text-xs text-muted-foreground">
                            {e.examDate && <span>{e.examDate}</span>}
                            {e.examDate && e.description && <span> · </span>}
                            {e.description && <span className="truncate">{e.description}</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon-xs" onClick={() => setInvoiceBind({ sourceType: "EXAMINATION", sourceId: e.id })}><LinkIcon className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => setExamEditing(e)}><PencilIcon className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => { deleteExamination(e.id).then(() => fetchDetail()).catch(() => {}); }}><TrashIcon className="size-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lab Tests */}
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
                  {labTests.map((lt) => (
                    <div key={lt.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{lt.name}</div>
                        {(lt.testDate || lt.description) && (
                          <div className="text-xs text-muted-foreground">
                            {lt.testDate && <span>{lt.testDate}</span>}
                            {lt.testDate && lt.description && <span> · </span>}
                            {lt.description && <span className="truncate">{lt.description}</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon-xs" onClick={() => setInvoiceBind({ sourceType: "LAB_TEST", sourceId: lt.id })}><LinkIcon className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => setTestEditing(lt)}><PencilIcon className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => { deleteLabTest(lt.id).then(() => fetchDetail()).catch(() => {}); }}><TrashIcon className="size-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prescriptions */}
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
                  {prescriptions.map((p) => (
                    <div key={p.id} className="rounded-md border px-3 py-2">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          {p.description && <p className="text-sm mb-1">{p.description}</p>}
                          {p.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-xs py-0.5">
                              <span className="font-medium">{item.medicationName}</span>
                              {item.dosageMethod && <span className="text-muted-foreground">{item.dosageMethod}</span>}
                              {item.dosageQuantity && <span className="text-muted-foreground">{item.dosageQuantity}{item.dosageUnit}</span>}
                              {item.note && <span className="text-muted-foreground">({item.note})</span>}
                              <Button variant="ghost" size="icon-xs" className="ml-auto" onClick={() => { deletePrescriptionItem(item.id).then(() => fetchDetail()).catch(() => {}); }}>
                                <TrashIcon className="size-2.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <Button variant="ghost" size="icon-xs" onClick={() => setInvoiceBind({ sourceType: "PRESCRIPTION", sourceId: p.id })}><LinkIcon className="size-3.5" /></Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => setPrescEditing(p)}><PencilIcon className="size-3.5" /></Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => { deletePrescription(p.id).then(() => fetchDetail()).catch(() => {}); }}><TrashIcon className="size-3.5" /></Button>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs h-6 -ml-2 mt-1" onClick={() => setItemAddPrescId(p.id)}>
                        <PlusIcon className="size-2.5" /> {t("medical.addItem")}
                      </Button>
                    </div>
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

        <CreateExaminationDialog open={examOpen || !!examEditing} visitId={visitId!} initialData={examEditing} onClose={() => { setExamOpen(false); setExamEditing(null); }} onSuccess={() => { void fetchDetail(); onRefresh(); }} />
        <CreateLabTestDialog open={testOpen || !!testEditing} visitId={visitId!} initialData={testEditing} onClose={() => { setTestOpen(false); setTestEditing(null); }} onSuccess={() => { void fetchDetail(); onRefresh(); }} />
        <CreatePrescriptionDialog open={prescOpen || !!prescEditing} visitId={visitId!} initialData={prescEditing} onClose={() => { setPrescOpen(false); setPrescEditing(null); }} onSuccess={() => { void fetchDetail(); onRefresh(); }} />
        <CreatePrescriptionItemDialog open={itemAddPrescId !== null} onClose={() => setItemAddPrescId(null)} onSubmit={async (data) => { if (itemAddPrescId) { await addPrescriptionItem(itemAddPrescId, data); void fetchDetail(); } }} />
        <BindVisitInvoiceDialog boundInvoiceIds={visitInvoices.map((i) => i.invoiceId)} open={invoiceBind !== null} onClose={() => setInvoiceBind(null)} onBind={handleInvoiceBindAction} onCreateNew={() => setCreateInvoiceOpen(true)} />
        <CreateInvoiceDialog open={createInvoiceOpen} onClose={() => setCreateInvoiceOpen(false)} onSuccess={() => {}} onCreated={async (created: InvoiceDetail) => { if (invoiceBind && visitId) { await bindVisitInvoice(visitId, created.id, invoiceBind.sourceType, invoiceBind.sourceId); void fetchDetail(); } }} />
      </SheetContent>
    </Sheet>
  );
};

export default VisitDetailDrawer;
