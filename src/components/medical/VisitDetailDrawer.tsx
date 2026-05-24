import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon, LinkIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  type VisitPrescription, type VisitAttachment, type VisitInvoice,
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
  onRefresh: () => void;
}

const VisitDetailDrawer = ({ open, visitId, onClose, onRefresh }: Props) => {
  const { t } = useTranslation();
  const [record, setRecord] = useState<VisitRecord | null>(null);
  const [examinations, setExaminations] = useState<VisitExamination[]>([]);
  const [labTests, setLabTests] = useState<VisitLabTest[]>([]);
  const [prescriptions, setPrescriptions] = useState<VisitPrescription[]>([]);
  const [attachments, setAttachments] = useState<VisitAttachment[]>([]);
  const [invoices, setInvoices] = useState<VisitInvoice[]>([]);

  // Dialogs
  const [examOpen, setExamOpen] = useState(false);
  const [examEditing, setExamEditing] = useState<VisitExamination | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testEditing, setTestEditing] = useState<VisitLabTest | null>(null);
  const [prescOpen, setPrescOpen] = useState(false);
  const [prescEditing, setPrescEditing] = useState<VisitPrescription | null>(null);
  const [itemAddPrescId, setItemAddPrescId] = useState<number | null>(null);
  const [itemEditData, setItemEditData] = useState<{ prescriptionId: number; medicationReminderId: number; note?: string; itemId?: number } | null>(null);
  const [invoiceBind, setInvoiceBind] = useState<{ sourceType: VisitSourceType; sourceId: number } | null>(null);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    if (!visitId) return;
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
      setInvoices(invs);
    } catch {} finally { setLoading(false); }
  }, [visitId]);

  useEffect(() => {
    if (open && visitId) void fetchDetail();
  }, [open, visitId, fetchDetail]);

  const handleInvoiceBind = async (invoiceId: number) => {
    if (!invoiceBind || !visitId) return;
    await bindVisitInvoice(visitId, invoiceId, invoiceBind.sourceType, invoiceBind.sourceId);
    void fetchDetail();
  };

  const handleInvoiceUnbind = async (id: number) => {
    try { await unbindVisitInvoice(id); void fetchDetail(); } catch {}
  };

  const handleItemAdd = async (data: { medicationReminderId: number; note?: string }) => {
    if (!itemAddPrescId) return;
    await addPrescriptionItem(itemAddPrescId, data);
    void fetchDetail();
  };

  const handleItemDelete = async (id: number) => {
    try { await deletePrescriptionItem(id); void fetchDetail(); } catch {}
  };

  if (loading || !record) return (
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <SheetContent showCloseButton={false} className="sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>{t("common.loading")}</SheetTitle></SheetHeader>
          <p className="text-sm text-muted-foreground py-8 text-center">{t("common.loading")}</p>
        </SheetContent>
      </Sheet>
    );

  const isInpatient = record.visitType === "INPATIENT";
  const visitAttachments = attachments.filter((a) => a.sourceType === "RECORD");

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <SheetContent showCloseButton={false} className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{record.patientName}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-wrap gap-2">
            <Badge variant={isInpatient ? "default" : "secondary"}>
              {isInpatient ? t("medical.visitType.INPATIENT") : t("medical.visitType.OUTPATIENT")}
            </Badge>
            {record.patientGender && <Badge variant="outline">{t(`medical.gender.${record.patientGender}`)}</Badge>}
            {record.patientAge != null && <Badge variant="outline">{record.patientAge}{t("medical.age")}</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">{t("medical.form.institution")}: </span><span>{record.institutionName}</span></div>
            <div><span className="text-muted-foreground">{t("medical.form.doctor")}: </span><span>{record.doctor || "-"}</span></div>
            <div><span className="text-muted-foreground">{isInpatient ? t("medical.form.admissionDept") : t("medical.form.department")}: </span><span>{record.department || "-"}</span></div>
            <div><span className="text-muted-foreground">{isInpatient ? t("medical.form.admissionDate") : t("medical.form.visitDate")}: </span><span>{record.visitDate}</span></div>
            {isInpatient && (<>
              <div><span className="text-muted-foreground">{t("medical.form.dischargeDept")}: </span><span>{record.dischargeDept || "-"}</span></div>
              <div><span className="text-muted-foreground">{t("medical.form.dischargeDate")}: </span><span>{record.dischargeDate || "-"}</span></div>
            </>)}
          </div>

          {record.medicalContent && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">{t("medical.form.medicalContent")}:</p>
              <p className="whitespace-pre-wrap">{record.medicalContent}</p>
            </div>
          )}

                    <AttachmentManager
            attachments={visitAttachments.map((a) => ({ id: a.id, filename: a.originalFilename, fileSize: a.fileSize } satisfies AttachmentItem))}
            uploadLabel={t("medical.uploadAttachment")}
            emptyLabel={t("medical.noAttachments")}
            onUpload={async (file) => { if (visitId) { await uploadVisitAttachment(visitId, file, "RECORD", visitId); void fetchDetail(); } }}
            onDelete={async (id) => { await deleteVisitAttachment(id); void fetchDetail(); }}
          />

          <InvoiceBindingManager
            invoices={invoices.filter((i) => i.sourceType === "RECORD").map((inv) => ({
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
          />

          {/* Examinations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">{t("medical.examinations")}</h3>
              <Button size="sm" variant="outline" onClick={() => setExamOpen(true)}>
                <PlusIcon className="size-3" /> {t("medical.addExamination")}
              </Button>
            </div>
            {examinations.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("medical.noExaminations")}</p>
            ) : (
              <div className="space-y-2">
                {examinations.map((e) => (
                  <div key={e.id} className="rounded border p-2 text-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{e.name}</p>
                        {e.examDate && <p className="text-xs text-muted-foreground">{e.examDate}</p>}
                        {e.description && <p className="text-xs mt-0.5">{e.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon-xs" onClick={() => setInvoiceBind({ sourceType: "EXAMINATION", sourceId: e.id })}><LinkIcon className="size-3" /></Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => setExamEditing(e)}><PencilIcon className="size-3" /></Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => { deleteExamination(e.id).then(() => fetchDetail()).catch(() => {}); }}><TrashIcon className="size-3" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lab Tests */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">{t("medical.labTests")}</h3>
              <Button size="sm" variant="outline" onClick={() => setTestOpen(true)}>
                <PlusIcon className="size-3" /> {t("medical.addLabTest")}
              </Button>
            </div>
            {labTests.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("medical.noLabTests")}</p>
            ) : (
              <div className="space-y-2">
                {labTests.map((lt) => (
                  <div key={lt.id} className="rounded border p-2 text-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{lt.name}</p>
                        {lt.testDate && <p className="text-xs text-muted-foreground">{lt.testDate}</p>}
                        {lt.description && <p className="text-xs mt-0.5">{lt.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon-xs" onClick={() => setInvoiceBind({ sourceType: "LAB_TEST", sourceId: lt.id })}><LinkIcon className="size-3" /></Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => setTestEditing(lt)}><PencilIcon className="size-3" /></Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => { deleteLabTest(lt.id).then(() => fetchDetail()).catch(() => {}); }}><TrashIcon className="size-3" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">{t("medical.prescriptions")}</h3>
              <Button size="sm" variant="outline" onClick={() => setPrescOpen(true)}>
                <PlusIcon className="size-3" /> {t("medical.addPrescription")}
              </Button>
            </div>
            {prescriptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("medical.noPrescriptions")}</p>
            ) : (
              <div className="space-y-2">
                {prescriptions.map((p) => (
                  <div key={p.id} className="rounded border p-2 text-sm">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        {p.description && <p className="text-xs">{p.description}</p>}
                        <div className="flex gap-1 mt-1">
                          <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setItemAddPrescId(p.id)}>
                            <PlusIcon className="size-2.5" /> {t("medical.addItem")}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setInvoiceBind({ sourceType: "PRESCRIPTION", sourceId: p.id })}>
                            <LinkIcon className="size-2.5" /> {t("medical.bindInvoice")}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon-xs" onClick={() => setPrescEditing(p)}><PencilIcon className="size-3" /></Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => { deletePrescription(p.id).then(() => fetchDetail()).catch(() => {}); }}><TrashIcon className="size-3" /></Button>
                      </div>
                    </div>
                    {p.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs mt-1 ml-2 border-l-2 pl-2">
                        <span className="font-medium">{item.medicationName}</span>
                        {item.dosageMethod && <span className="text-muted-foreground">{item.dosageMethod}</span>}
                        {item.dosageQuantity && <span className="text-muted-foreground">{item.dosageQuantity}{item.dosageUnit}</span>}
                        {item.note && <span className="text-muted-foreground">({item.note})</span>}
                        <div className="flex gap-0.5 ml-auto">
                          <Button variant="ghost" size="icon-xs" onClick={() => handleItemDelete(item.id)}><TrashIcon className="size-2.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CreateExaminationDialog open={examOpen || !!examEditing} visitId={visitId!} initialData={examEditing} onClose={() => { setExamOpen(false); setExamEditing(null); }} onSuccess={() => { void fetchDetail(); onRefresh(); }} />
      <CreateLabTestDialog open={testOpen || !!testEditing} visitId={visitId!} initialData={testEditing} onClose={() => { setTestOpen(false); setTestEditing(null); }} onSuccess={() => { void fetchDetail(); onRefresh(); }} />
      <CreatePrescriptionDialog open={prescOpen || !!prescEditing} visitId={visitId!} initialData={prescEditing} onClose={() => { setPrescOpen(false); setPrescEditing(null); }} onSuccess={() => { void fetchDetail(); onRefresh(); }} />
      <CreatePrescriptionItemDialog open={itemAddPrescId !== null} onClose={() => setItemAddPrescId(null)} onSubmit={handleItemAdd} />
      <BindVisitInvoiceDialog
        boundInvoiceIds={invoices.map((i) => i.invoiceId)}
        open={invoiceBind !== null}
        onClose={() => setInvoiceBind(null)}
        onBind={async (invoiceId) => { await handleInvoiceBind(invoiceId); }}
        onCreateNew={() => setCreateInvoiceOpen(true)}
      />
      <CreateInvoiceDialog
        open={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        onSuccess={() => {}}
        onCreated={async (created: InvoiceDetail) => {
          if (invoiceBind && visitId) {
            await bindVisitInvoice(visitId, created.id, invoiceBind.sourceType, invoiceBind.sourceId);
            void fetchDetail();
          }
        }}
      />
    </>
  );
};

export default VisitDetailDrawer;
