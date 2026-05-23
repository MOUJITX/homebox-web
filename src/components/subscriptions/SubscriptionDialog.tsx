import { useEffect, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilIcon } from "lucide-react";
import type { Subscription, SubscriptionRequest, SubscriptionType, BillingMode, SubscriptionStatus } from "@/api/subscriptions";
import { createSubscription, updateSubscription } from "@/api/subscriptions";
import { usePlatforms } from "@/hooks/queries/usePlatforms";
import { getErrorMessage } from "@/lib/error";
import { useQueryClient } from "@tanstack/react-query";
import { subscriptionKeys } from "@/hooks/queries/subscriptionKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectPopup, SelectItem, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import PlatformManagerDialog from "./PlatformManagerDialog";

const SUBSCRIPTION_TYPES: SubscriptionType[] = ["PAY_AS_YOU_GO", "PERIODIC"];
const BILLING_MODES: BillingMode[] = ["PREPAID", "POSTPAID"];
const STATUSES: SubscriptionStatus[] = ["ACTIVE", "INACTIVE", "CANCELLED"];

interface SubscriptionDialogProps {
  readonly open: boolean;
  readonly subscription?: Subscription | null;
  readonly onClose: () => void;
}

const SubscriptionDialog = ({ open, subscription, onClose }: SubscriptionDialogProps) => {
  const { t } = useTranslation();
  const { data: platforms = [] } = usePlatforms();
  const queryClient = useQueryClient();
  const isEdit = !!subscription;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>("PERIODIC");
  const [billingMode, setBillingMode] = useState<BillingMode | null>(null);
  const [platformId, setPlatformId] = useState<number | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus>("ACTIVE");
  const [renewNoticeDays, setRenewNoticeDays] = useState(7);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [platformManagerOpen, setPlatformManagerOpen] = useState(false);

  const initForm = () => {
    if (subscription) {
      setName(subscription.name);
      setDescription(subscription.description ?? "");
      setSubscriptionType(subscription.subscriptionType);
      setBillingMode(subscription.billingMode);
      setPlatformId(subscription.platformId);
      setStatus(subscription.status);
      setRenewNoticeDays(subscription.renewNoticeDays);
      setNote(subscription.note ?? "");
    } else {
      setName("");
      setDescription("");
      setSubscriptionType("PERIODIC");
      setBillingMode(null);
      setPlatformId(null);
      setStatus("ACTIVE");
      setRenewNoticeDays(7);
      setNote("");
    }
    setError("");
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) onClose();
  };

  // Re-initialize form when opening or when subscription prop changes
  useEffect(() => {
    if (open) initForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subscription]);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("subscriptions.form.nameRequired"));
      return;
    }
    if (!platformId) {
      setError(t("subscriptions.form.platformRequired"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const data: SubscriptionRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        subscriptionType,
        billingMode: subscriptionType === "PAY_AS_YOU_GO" ? billingMode ?? undefined : undefined,
        platformId,
        status,
        renewNoticeDays: subscriptionType === "PERIODIC" ? renewNoticeDays : undefined,
        note: note.trim() || undefined,
      };

      if (isEdit) {
        await updateSubscription(subscription!.id, data);
      } else {
        await createSubscription(data);
      }

      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err) ?? t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const platformOptions = platforms.map((p) => ({ value: p.id, label: p.name }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("subscriptions.edit") : t("subscriptions.create")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("subscriptions.editDescription") : t("subscriptions.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="grid gap-4" id="subscription-form">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("subscriptions.form.name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t("subscriptions.form.description")}</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>{t("subscriptions.form.platform")}</Label>
              <div className="flex gap-1">
                <div className="flex-1">
                  <SearchableSelect
                    value={platformId}
                    onChange={(v) => setPlatformId(v)}
                    options={platformOptions}
                    placeholder={t("subscriptions.searchPlaceholder")}
                    emptyMessage={t("common.noResults")}
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setPlatformManagerOpen(true)}>
                  <PlusIcon className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t("subscriptions.form.subscriptionType")}</Label>
              <div className="flex gap-2">
                {SUBSCRIPTION_TYPES.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={subscriptionType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSubscriptionType(type)}
                  >
                    {t(`subscriptions.types.${type === "PAY_AS_YOU_GO" ? "payAsYouGo" : "periodic"}`)}
                  </Button>
                ))}
              </div>
            </div>

            {subscriptionType === "PAY_AS_YOU_GO" && (
              <div className="grid gap-2">
                <Label>{t("subscriptions.form.billingMode")}</Label>
                <Select value={billingMode} onValueChange={(v) => setBillingMode(v as BillingMode)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("subscriptions.form.billingMode")}>
                    {() => billingMode ? t(`subscriptions.billingModes.${billingMode === "PREPAID" ? "prepaid" : "postpaid"}`) : t("subscriptions.form.billingMode")}
                  </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    {BILLING_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {t(`subscriptions.billingModes.${mode === "PREPAID" ? "prepaid" : "postpaid"}`)}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>{t("subscriptions.form.status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
                <SelectTrigger>
                  <SelectValue>
                    {() => t(`subscriptions.status.${status.toLowerCase()}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`subscriptions.status.${s.toLowerCase()}`)}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>

            {subscriptionType === "PERIODIC" && (
              <div className="grid gap-2">
                <Label htmlFor="renewNoticeDays">{t("subscriptions.form.renewNoticeDays")}</Label>
                <Input id="renewNoticeDays" type="number" min={1} max={90} value={renewNoticeDays} onChange={(e) => setRenewNoticeDays(Number(e.target.value))} />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="note">{t("subscriptions.form.note")}</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </div>

        <DialogFooter className="shrink-0 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="subscription-form" disabled={submitting}>
            {isEdit ? <PencilIcon className="size-4" /> : <PlusIcon className="size-4" />}
            {isEdit ? t("common.save") : t("subscriptions.create")}
          </Button>
        </DialogFooter>
      </DialogContent>

      <PlatformManagerDialog open={platformManagerOpen} onClose={() => setPlatformManagerOpen(false)} />
    </Dialog>
  );
};

export default SubscriptionDialog;
