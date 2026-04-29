import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const DashboardPage = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
        <Button variant="outline" onClick={logout}>
          {t("common.logout")}
        </Button>
      </div>
      <p className="mt-4 text-muted-foreground">{t("dashboard.placeholder")}</p>
    </div>
  );
};

export default DashboardPage;
