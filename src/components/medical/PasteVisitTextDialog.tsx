import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseVisitRecord } from "@/api/medical";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (result: Record<string, unknown>) => void;
}

const PasteVisitTextDialog = ({ open, onClose, onApply }: Props) => {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    try {
      const { data } = await parseVisitRecord(text.trim());
      if (data) {
        onApply(data as unknown as Record<string, unknown>);
      }
    } catch {
      // handled by interceptor
    } finally {
      setParsing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("medical.parsePaste")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            {t("medical.parseHint")}
          </p>
          <textarea
            className="flex w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none min-h-40"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("medical.parsePlaceholder")}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleParse} disabled={parsing || !text.trim()}>
            {parsing ? t("common.loading") : t("medical.parse")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PasteVisitTextDialog;
