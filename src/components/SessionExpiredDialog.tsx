import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SessionExpiredDialog = () => {
  const { t } = useTranslation();
  const { sessionExpired, dismissSessionExpired } = useAuth();

  return (
    <Dialog open={sessionExpired} modal disablePointerDismissal>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("sessionExpired.title")}</DialogTitle>
          <DialogDescription>
            {t("sessionExpired.description")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="w-full" onClick={dismissSessionExpired}>
            {t("sessionExpired.action")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionExpiredDialog;
