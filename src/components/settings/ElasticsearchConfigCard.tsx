import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  getSystemConfigGroup,
  saveSystemConfigGroup,
  testElasticsearchConnection,
} from "@/api/systemConfig";
import { getErrorMessage } from "@/lib/error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ElasticsearchConfigCard = () => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await getSystemConfigGroup("elasticsearch");
      for (const item of data.items) {
        if (item.key === "elasticsearch.enabled") {
          setEnabled(item.value === "true");
        }
      }
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleEnabledChange = async (checked: boolean) => {
    setEnabled(checked);
    setSaving(true);
    try {
      await saveSystemConfigGroup("elasticsearch", {
        "elasticsearch.enabled": checked ? "true" : "false",
      });
      toast.success(t("settings.saveSuccess"));
    } catch (err) {
      setEnabled(!checked); // rollback
      toast.error(getErrorMessage(err) ?? t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (testing) return;
    setTesting(true);
    try {
      const { data } = await testElasticsearchConnection();
      if (data.success) {
        toast.success(t("settings.elasticsearch.testSuccess"));
      } else {
        toast.error(
          t("settings.elasticsearch.testFailed", { message: data.message }),
        );
      }
    } catch (err) {
      toast.error(
        t("settings.elasticsearch.testFailed", {
          message: getErrorMessage(err) ?? "",
        }),
      );
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("common.loading")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.elasticsearch.title")}</CardTitle>
        <CardDescription>
          {t("settings.elasticsearch.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="es-enabled"
            checked={enabled}
            onCheckedChange={(checked) => handleEnabledChange(checked === true)}
            disabled={saving}
          />
          <Label htmlFor="es-enabled" className="cursor-pointer">
            {t("settings.elasticsearch.fields.enabled")}
          </Label>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={testing || !enabled}
        >
          {testing
            ? t("common.loading")
            : t("common.testConnection")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ElasticsearchConfigCard;
