import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  getSystemConfigGroup,
  saveSystemConfigGroup,
  testQiniuConnection,
  testAiConnection,
  type SystemConfigItem,
  type AiModel,
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import { PlusIcon } from "lucide-react";
import MaskedInput from "@/components/settings/MaskedInput";
import AiModelsDialog from "@/components/settings/AiModelsDialog";
import NotificationConfigCard from "@/components/settings/NotificationConfigCard";

interface ConfigGroupCardProps {
  readonly group: string;
  readonly title: string;
  readonly description: string;
  readonly onTest: () => Promise<void>;
  readonly testLabel: string;
  readonly fieldLabels: Record<string, string>;
  readonly fieldPlaceholders: Record<string, string>;
  readonly textareaKeys?: readonly string[];
}

const ConfigGroupCard = ({
  group,
  title,
  description,
  onTest,
  testLabel,
  fieldLabels,
  fieldPlaceholders,
  textareaKeys,
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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
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
              {textareaKeys?.includes(item.key) ? (
                <textarea
                  id={`config-${item.key}`}
                  value={formValues[item.key] ?? ""}
                  onChange={(e) => handleFieldChange(item.key, e.target.value)}
                  placeholder={fieldPlaceholders[item.key]}
                  rows={6}
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              ) : (
                <MaskedInput
                  id={`config-${item.key}`}
                  value={formValues[item.key] ?? ""}
                  onChange={(v) => handleFieldChange(item.key, v)}
                  placeholder={fieldPlaceholders[item.key]}
                  sensitive={item.sensitive}
                />
              )}
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

const AiConfigCard = () => {
  const { t } = useTranslation();
  const [models, setModels] = useState<AiModel[]>([]);
  const [activeModelId, setActiveModelId] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await getSystemConfigGroup("ai");
      const map: Record<string, string> = {};
      for (const item of data.items) {
        map[item.key] = item.value;
      }
      try {
        setModels(map["ai.models"] ? JSON.parse(map["ai.models"]) : []);
      } catch {
        setModels([]);
      }
      setActiveModelId(map["ai.active-model"] ?? "");
      setSystemPrompt(map["ai.system-prompt"] ?? "");
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        "ai.models": JSON.stringify(models),
        "ai.active-model": activeModelId,
        "ai.system-prompt": systemPrompt,
      };
      await saveSystemConfigGroup("ai", payload);
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
      const { data } = await testAiConnection();
      if (data.success) {
        toast.success(t("settings.ai.testSuccess"));
      } else {
        toast.error(t("settings.ai.testFailed", { message: data.message }));
      }
    } catch (err) {
      toast.error(t("settings.ai.testFailed", { message: getErrorMessage(err) ?? "" }));
    } finally {
      setTesting(false);
    }
  };

  const handleModelsSave = async (updatedModels: AiModel[]) => {
    setModels(updatedModels);
    const payload: Record<string, string> = {
      "ai.models": JSON.stringify(updatedModels),
    };
    if (activeModelId && !updatedModels.find((m) => m.id === activeModelId)) {
      setActiveModelId("");
      payload["ai.active-model"] = "";
    }
    await saveSystemConfigGroup("ai", payload);
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.ai.title")}</CardTitle>
          <CardDescription>{t("settings.ai.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t("settings.ai.fields.model")}</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={activeModelId}
                  onValueChange={(val) => setActiveModelId(val as string)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {activeModelId
                        ? models.find((m) => m.id === activeModelId)?.name
                        : t("settings.ai.placeholders.model")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {models.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {t("settings.ai.noModels")}
                      </div>
                    ) : (
                      models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectPopup>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setDialogOpen(true)}
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ai-system-prompt">{t("settings.ai.fields.systemPrompt")}</Label>
            <textarea
              id="ai-system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder={t("settings.ai.placeholders.systemPrompt")}
              rows={6}
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? t("common.loading") : t("settings.ai.testConnection")}
          </Button>
        </CardFooter>
      </Card>

      <AiModelsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        models={models}
        onSave={handleModelsSave}
      />
    </>
  );
};

type SettingsTab = "storage" | "ai" | "notification";

const settingsTabs: { key: SettingsTab; label: string }[] = [
  { key: "storage", label: "settings.tabs.storage" },
  { key: "ai", label: "settings.tabs.ai" },
  { key: "notification", label: "settings.tabs.notification" },
];

const SettingsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("storage");

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

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex border-b">
        {settingsTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      {activeTab === "storage" && (
        <div className="grid gap-6">
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
        </div>
      )}

      {activeTab === "ai" && (
        <div className="grid gap-6">
          <AiConfigCard />
        </div>
      )}

      {activeTab === "notification" && (
        <div className="grid gap-6">
          <NotificationConfigCard />
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
