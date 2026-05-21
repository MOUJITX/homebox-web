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
import { Input } from "@/components/ui/input";
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
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await getSystemConfigGroup("elasticsearch");
      const values: Record<string, string> = {};
      for (const item of data.items) {
        values[item.key] = item.value;
      }
      setFormValues(values);
      setEnabled(values["elasticsearch.enabled"] === "true");
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    setFormValues((prev) => ({
      ...prev,
      "elasticsearch.enabled": checked ? "true" : "false",
    }));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveSystemConfigGroup("elasticsearch", formValues);
      toast.success(t("settings.saveSuccess"));
      await fetchConfig();
    } catch (err) {
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
          />
          <Label htmlFor="es-enabled" className="cursor-pointer">
            {t("settings.elasticsearch.fields.enabled")}
          </Label>
        </div>

        {enabled && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="es-host">
                {t("settings.elasticsearch.fields.host")}
              </Label>
              <Input
                id="es-host"
                value={formValues["elasticsearch.host"] ?? ""}
                onChange={(e) =>
                  handleFieldChange("elasticsearch.host", e.target.value)
                }
                placeholder={t("settings.elasticsearch.placeholders.host")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="es-port">
                {t("settings.elasticsearch.fields.port")}
              </Label>
              <Input
                id="es-port"
                value={formValues["elasticsearch.port"] ?? ""}
                onChange={(e) =>
                  handleFieldChange("elasticsearch.port", e.target.value)
                }
                placeholder={t("settings.elasticsearch.placeholders.port")}
              />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("common.saving") : t("common.save")}
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={testing}>
          {testing
            ? t("common.loading")
            : t("settings.elasticsearch.testConnection")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ElasticsearchConfigCard;
