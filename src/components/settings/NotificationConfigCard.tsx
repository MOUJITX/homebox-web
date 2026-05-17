import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  getSystemConfigGroup,
  saveSystemConfigGroup,
} from "@/api/systemConfig";
import { testWebhook } from "@/api/notifications";
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

const NotificationConfigCard = () => {
  const { t } = useTranslation();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await getSystemConfigGroup("notification");
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
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await saveSystemConfigGroup("notification", formValues);
      toast.success(t("settings.saveSuccess"));
      await fetchConfig();
    } catch (err) {
      toast.error(getErrorMessage(err) ?? t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (testing) return;
    setTesting(true);
    try {
      const { data } = await testWebhook();
      if (data.success) {
        toast.success(t("settings.notification.testSuccess"));
      } else {
        toast.error(
          t("settings.notification.testFailed", { message: data.message }),
        );
      }
    } catch (err) {
      toast.error(
        t("settings.notification.testFailed", {
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
        <CardTitle>{t("settings.notification.title")}</CardTitle>
        <CardDescription>
          {t("settings.notification.description")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="grid gap-4">
          {/* Webhook Enabled */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="config-notification.webhook-enabled"
              checked={formValues["notification.webhook-enabled"] === "true"}
              onCheckedChange={(checked) =>
                handleChange(
                  "notification.webhook-enabled",
                  checked ? "true" : "false",
                )
              }
            />
            <Label htmlFor="config-notification.webhook-enabled">
              {t("settings.notification.fields.webhookEnabled")}
            </Label>
          </div>

          {/* Webhook URL */}
          {formValues["notification.webhook-enabled"] === "true" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="config-notification.webhook-url">
                  {t("settings.notification.fields.webhookUrl")}
                </Label>
                <input
                  id="config-notification.webhook-url"
                  value={formValues["notification.webhook-url"] ?? ""}
                  onChange={(e) =>
                    handleChange("notification.webhook-url", e.target.value)
                  }
                  placeholder={t(
                    "settings.notification.placeholders.webhookUrl",
                  )}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {/* Webhook Template */}
              <div className="grid gap-2">
                <Label htmlFor="config-notification.webhook-template">
                  {t("settings.notification.fields.webhookTemplate")}
                </Label>
                <textarea
                  id="config-notification.webhook-template"
                  value={formValues["notification.webhook-template"] ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "notification.webhook-template",
                      e.target.value,
                    )
                  }
                  placeholder={t(
                    "settings.notification.placeholders.webhookTemplate",
                  )}
                  rows={8}
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <span className="text-xs text-muted-foreground">
                  {t("settings.notification.templateHint")}
                </span>
              </div>
            </>
          )}

          {/* Cron Expression */}
          <div className="grid gap-2">
            <Label htmlFor="config-notification.crontab">
              {t("settings.notification.fields.crontab")}
            </Label>
            <input
              id="config-notification.crontab"
              value={formValues["notification.crontab"] ?? ""}
              onChange={(e) =>
                handleChange("notification.crontab", e.target.value)
              }
              placeholder={t("settings.notification.placeholders.crontab")}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Asset Expiring Soon Days */}
          <div className="grid gap-2">
            <Label htmlFor="config-notification.asset-expiring-soon-days">
              {t("settings.notification.fields.assetExpiringSoonDays")}
            </Label>
            <input
              id="config-notification.asset-expiring-soon-days"
              type="number"
              min="1"
              value={
                formValues["notification.asset-expiring-soon-days"] ?? "30"
              }
              onChange={(e) =>
                handleChange(
                  "notification.asset-expiring-soon-days",
                  e.target.value,
                )
              }
              placeholder={t(
                "settings.notification.placeholders.assetExpiringSoonDays",
              )}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleTestWebhook}
            disabled={testing}
          >
            {testing
              ? t("common.loading")
              : t("settings.notification.testWebhook")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default NotificationConfigCard;
