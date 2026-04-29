import { useTranslation } from "react-i18next";

const DashboardPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <p className="text-muted-foreground">{t("dashboard.placeholder")}</p>
    </div>
  );
};

export default DashboardPage;
