import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon, UploadIcon, LinkIcon } from "lucide-react";
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
import CreateExaminationDialog from "./CreateExaminationDialog";
import CreateLabTestDialog from "./CreateLabTestDialog";
import CreatePrescriptionDialog from "./CreatePrescriptionDialog";
import CreatePrescriptionItemDialog from "./CreatePrescriptionItemDialog";
import BindVisitInvoiceDialog from "./BindVisitInvoiceDialog";

interface Props {
  open: boolean;
  visitId: number | null;
  onClose: () => void;
  onRefresh: () => void;
}

const VisitDetailDrawer = ({ open, visitId, onClose, onRefresh }: Props) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !visitId) return;
    try {
      await uploadVisitAttachment(visitId, file, "RECORD", visitId);
      void fetchDetail();
    } catch {}
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAttachmentDelete = async (id: number) => {
    try { await deleteVisitAttachment(id); void fetchDetail(); } catch {}
  };

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

          {/* Attachments (visit level) */}
          <div className="text-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground">{t("medical.attachments")}:</p>
              <div className="flex gap-1">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleAttachmentUpload} />
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <UploadIcon className="size-3" /> {t("medical.uploadAttachment")}
                </Button>
              </div>
            </div>
            {visitAttachments.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("medical.noAttachments")}</p>
            ) : (
              <div className="space-y-1">
                {visitAttachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                    <span>{a.originalFilename} ({(a.fileSize / 1024).toFixed(1)}KB)</span>
                    <Button variant="ghost" size="icon-xs" onClick={() => handleAttachmentDelete(a.id)}><TrashIcon className="size-3" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoices (visit level) */}
          <div className="text-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground">{t("medical.invoices")}:</p>
              <Button size="sm" variant="outline" onClick={() => setInvoiceBind({ sourceType: "RECORD", sourceId: visitId! })}>
                <LinkIcon className="size-3" /> {t("medical.bindInvoice")}
              </Button>
            </div>
            {invoices.filter((i) => i.sourceType === "RECORD").length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("medical.noInvoices")}</p>
            ) : (
              <div className="space-y-1">
                {invoices.filter((i) => i.sourceType === "RECORD").map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                    <span>{inv.invoiceNumber ?? `#${inv.invoiceId}`} - {inv.totalAmount}</span>
                    <Button variant="ghost" size="icon-xs" onClick={() => handleInvoiceUnbind(inv.id)}><TrashIcon className="size-3" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
      <BindVisitInvoiceDialog open={invoiceBind !== null} visitId={visitId!} sourceType={invoiceBind?.sourceType ?? "RECORD"} sourceId={invoiceBind?.sourceId ?? 0} onClose={() => setInvoiceBind(null)} onBind={handleInvoiceBind} />
    </>
  );
};

export default VisitDetailDrawer;
