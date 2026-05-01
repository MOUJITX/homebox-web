import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  getSystemConfigGroup,
  saveSystemConfigGroup,
  testQiniuConnection,
  testAiConnection,
  type SystemConfigItem,
} from "@/api/systemConfig";
import { getErrorMessage } from "@/lib/error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MaskedInput from "@/components/settings/MaskedInput";

interface ConfigGroupCardProps {
  readonly group: string;
  readonly title: string;
  readonly description: string;
  readonly onTest: () => Promise<void>;
  readonly testLabel: string;
  readonly fieldLabels: Record<string, string>;
  readonly fieldPlaceholders: Record<string, string>;
}

const ConfigGroupCard = ({
  group,
  title,
  description,
  onTest,
  testLabel,
  fieldLabels,
  fieldPlaceholders,
}: ConfigGroupCardProps) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<SystemConfigItem[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await getSystemConfigGroup(group);
      setItems(data.items);
      const values: Record<string, string> = {};
      for (const item of data.items) {
        values[item.key] = item.value;
      }
      setFormValues(values);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [group]);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await saveSystemConfigGroup(group, formValues);
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
      await onTest();
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
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="grid gap-4">
          {items.map((item) => (
            <div key={item.key} className="grid gap-2">
              <Label htmlFor={`config-${item.key}`}>
                {fieldLabels[item.key] ?? item.description ?? item.key}
              </Label>
              <MaskedInput
                id={`config-${item.key}`}
                value={formValues[item.key] ?? ""}
                onChange={(v) => handleFieldChange(item.key, v)}
                placeholder={fieldPlaceholders[item.key]}
                sensitive={item.sensitive}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
          <Button type="button" variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? t("common.loading") : testLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const SettingsPage = () => {
  const { t } = useTranslation();

  const handleTestQiniu = async () => {
    try {
      const { data } = await testQiniuConnection();
      if (data.success) {
        toast.success(t("settings.qiniu.testSuccess"));
      } else {
        toast.error(t("settings.qiniu.testFailed", { message: data.message }));
      }
    } catch (err) {
      toast.error(t("settings.qiniu.testFailed", { message: getErrorMessage(err) ?? "" }));
    }
  };

  const handleTestAi = async () => {
    try {
      const { data } = await testAiConnection();
      if (data.success) {
        toast.success(t("settings.ai.testSuccess"));
      } else {
        toast.error(t("settings.ai.testFailed", { message: data.message }));
      }
    } catch (err) {
      toast.error(t("settings.ai.testFailed", { message: getErrorMessage(err) ?? "" }));
    }
  };

  return (
    <div className="mx-auto grid max-w-lg gap-6">
      <ConfigGroupCard
        group="qiniu"
        title={t("settings.qiniu.title")}
        description={t("settings.qiniu.description")}
        onTest={handleTestQiniu}
        testLabel={t("settings.qiniu.testConnection")}
        fieldLabels={{
          "qiniu.access-key": t("settings.qiniu.fields.accessKey"),
          "qiniu.secret-key": t("settings.qiniu.fields.secretKey"),
          "qiniu.bucket": t("settings.qiniu.fields.bucket"),
          "qiniu.folder": t("settings.qiniu.fields.folder"),
          "qiniu.domain": t("settings.qiniu.fields.domain"),
        }}
        fieldPlaceholders={{
          "qiniu.access-key": t("settings.qiniu.placeholders.accessKey"),
          "qiniu.secret-key": t("settings.qiniu.placeholders.secretKey"),
          "qiniu.bucket": t("settings.qiniu.placeholders.bucket"),
          "qiniu.folder": t("settings.qiniu.placeholders.folder"),
          "qiniu.domain": t("settings.qiniu.placeholders.domain"),
        }}
      />

      <ConfigGroupCard
        group="ai"
        title={t("settings.ai.title")}
        description={t("settings.ai.description")}
        onTest={handleTestAi}
        testLabel={t("settings.ai.testConnection")}
        fieldLabels={{
          "ai.api-url": t("settings.ai.fields.apiUrl"),
          "ai.api-key": t("settings.ai.fields.apiKey"),
          "ai.model": t("settings.ai.fields.model"),
        }}
        fieldPlaceholders={{
          "ai.api-url": t("settings.ai.placeholders.apiUrl"),
          "ai.api-key": t("settings.ai.placeholders.apiKey"),
          "ai.model": t("settings.ai.placeholders.model"),
        }}
      />
    </div>
  );
};

export default SettingsPage;
