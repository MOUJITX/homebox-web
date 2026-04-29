import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BarcodeExistsDialogProps {
  readonly open: boolean;
  readonly barcode: string;
  readonly onClose: () => void;
  readonly onAddItem: () => void;
}

const BarcodeExistsDialog = ({
  open,
  barcode,
  onClose,
  onAddItem,
}: BarcodeExistsDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("goods.barcodeExists.title")}</DialogTitle>
          <DialogDescription>
            {t("goods.barcodeExists.description", { barcode })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("goods.barcodeExists.reInput")}
          </Button>
          <Button onClick={onAddItem}>
            {t("goods.barcodeExists.addItem")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeExistsDialog;
