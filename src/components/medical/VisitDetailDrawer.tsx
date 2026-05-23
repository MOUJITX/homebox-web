import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getVisitRecordById,
  getExaminations,
  deleteExamination,
  getLabTests,
  deleteLabTest,
  getPrescriptions,
  deletePrescription,
  type VisitRecord,
  type VisitExamination,
  type VisitLabTest,
  type VisitPrescription,
  type Page,
} from "@/api/medical";
import CreateExaminationDialog from "./CreateExaminationDialog";
import CreateLabTestDialog from "./CreateLabTestDialog";
import CreatePrescriptionDialog from "./CreatePrescriptionDialog";

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

  const [examOpen, setExamOpen] = useState(false);
  const [examEditing, setExamEditing] = useState<VisitExamination | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testEditing, setTestEditing] = useState<VisitLabTest | null>(null);
  const [prescOpen, setPrescOpen] = useState(false);
  const [prescEditing, setPrescEditing] = useState<VisitPrescription | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!visitId) return;
    try {
      const { data: r } = await getVisitRecordById(visitId);
      setRecord(r);
      const [{ data: exams }, { data: tests }, { data: prescs }] = await Promise.all([
        getExaminations(visitId, 0, 50),
        getLabTests(visitId, 0, 50),
        getPrescriptions(visitId, 0, 50),
      ]);
      setExaminations(exams.content);
      setLabTests(tests.content);
      setPrescriptions(prescs.content);
    } catch {
      // handled by interceptor
    }
  }, [visitId]);

  useEffect(() => {
    if (open && visitId) void fetchDetail();
  }, [open, visitId, fetchDetail]);

  const handleExamDelete = async (id: number) => {
    try { await deleteExamination(id); void fetchDetail(); } catch {}
  };
  const handleTestDelete = async (id: number) => {
    try { await deleteLabTest(id); void fetchDetail(); } catch {}
  };
  const handlePrescDelete = async (id: number) => {
    try { await deletePrescription(id); void fetchDetail(); } catch {}
  };

  if (!record) return null;

  const isInpatient = record.visitType === "INPATIENT";

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
            <div>
              <span className="text-muted-foreground">{isInpatient ? t("medical.form.admissionDate") : t("medical.form.visitDate")}: </span>
              <span>{record.visitDate}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("medical.form.institution")}: </span>
              <span>{record.institutionName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{isInpatient ? t("medical.form.admissionDept") : t("medical.form.department")}: </span>
              <span>{record.department || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("medical.form.doctor")}: </span>
              <span>{record.doctor || "-"}</span>
            </div>
            {isInpatient && (
              <>
                <div>
                  <span className="text-muted-foreground">{t("medical.form.dischargeDate")}: </span>
                  <span>{record.dischargeDate || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("medical.form.dischargeDept")}: </span>
                  <span>{record.dischargeDept || "-"}</span>
                </div>
              </>
            )}
          </div>

          {record.medicalContent && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">{t("medical.form.medicalContent")}:</p>
              <p className="whitespace-pre-wrap">{record.medicalContent}</p>
            </div>
          )}

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
                  <div key={e.id} className="flex items-start justify-between rounded border p-2 text-sm">
                    <div>
                      <p className="font-medium">{e.name}</p>
                      {e.examDate && <p className="text-xs text-muted-foreground">{e.examDate}</p>}
                      {e.description && <p className="text-xs mt-0.5">{e.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon-xs" onClick={() => setExamEditing(e)}><PencilIcon className="size-3" /></Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleExamDelete(e.id)}><TrashIcon className="size-3" /></Button>
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
                  <div key={lt.id} className="flex items-start justify-between rounded border p-2 text-sm">
                    <div>
                      <p className="font-medium">{lt.name}</p>
                      {lt.testDate && <p className="text-xs text-muted-foreground">{lt.testDate}</p>}
                      {lt.description && <p className="text-xs mt-0.5">{lt.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon-xs" onClick={() => setTestEditing(lt)}><PencilIcon className="size-3" /></Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleTestDelete(lt.id)}><TrashIcon className="size-3" /></Button>
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {p.description && <p className="text-xs mb-1">{p.description}</p>}
                        {p.items.map((item) => (
                          <div key={item.id} className="flex gap-2 text-xs mt-0.5">
                            <span className="font-medium">{item.medicationName}</span>
                            {item.dosageMethod && <span>{item.dosageMethod}</span>}
                            {item.dosageQuantity && <span>{item.dosageQuantity}{item.dosageUnit}</span>}
                            {item.note && <span className="text-muted-foreground">({item.note})</span>}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon-xs" onClick={() => setPrescEditing(p)}><PencilIcon className="size-3" /></Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => handlePrescDelete(p.id)}><TrashIcon className="size-3" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CreateExaminationDialog
        open={examOpen || !!examEditing}
        visitId={visitId!}
        initialData={examEditing}
        onClose={() => { setExamOpen(false); setExamEditing(null); }}
        onSuccess={() => { void fetchDetail(); onRefresh(); }}
      />
      <CreateLabTestDialog
        open={testOpen || !!testEditing}
        visitId={visitId!}
        initialData={testEditing}
        onClose={() => { setTestOpen(false); setTestEditing(null); }}
        onSuccess={() => { void fetchDetail(); onRefresh(); }}
      />
      <CreatePrescriptionDialog
        open={prescOpen || !!prescEditing}
        visitId={visitId!}
        initialData={prescEditing}
        onClose={() => { setPrescOpen(false); setPrescEditing(null); }}
        onSuccess={() => { void fetchDetail(); onRefresh(); }}
      />
    </>
  );
};

export default VisitDetailDrawer;
