import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ArrowUpIcon,
  PlusIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "lucide-react";
import type { Asset, WarrantyStatus } from "@/api/assets";
import { updateAsset } from "@/api/assets";
import { uploadAssetPicture, deleteAssetPicture } from "@/api/assetPictures";
import {
  uploadAssetAttachment,
  deleteAssetAttachment,
} from "@/api/assetAttachments";
import {
  bindInvoiceToAsset,
  unbindInvoiceFromAsset,
} from "@/api/assetInvoices";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useAssetDetail } from "@/hooks/queries/useAssetDetail";
import { useAssetInvoices } from "@/hooks/queries/useAssetInvoices";
import { useInvalidateAssets } from "@/hooks/queries/useInvalidateAssets";
import AuthImg from "@/components/AuthImg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import PictureManager from "@/components/shared/PictureManager";
import AttachmentManager from "@/components/shared/AttachmentManager";
import InvoiceBindingManager, {
  type BoundInvoice,
} from "@/components/shared/InvoiceBindingManager";
import CreateAssetDialog from "./CreateAssetDialog";
import EditAssetDialog from "./EditAssetDialog";
import DeleteAssetDialog from "./DeleteAssetDialog";

const Field = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="grid gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm">{value ?? "—"}</span>
  </div>
);

const warrantyBadgeVariant = (
  status: WarrantyStatus,
): "success" | "destructive" | "secondary" => {
  switch (status) {
    case "IN_WARRANTY":
      return "success";
    case "OUT_WARRANTY":
      return "destructive";
    case "NO_WARRANTY":
      return "secondary";
  }
};

interface AssetDetailDrawerProps {
  readonly assetId: number | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onNavigateToAsset: (id: number) => void;
}

const AssetDetailDrawer = ({
  assetId,
  open,
  onClose,
  onNavigateToAsset,
}: AssetDetailDrawerProps) => {
  const { t } = useTranslation();
  const {
    data: detail,
    isLoading,
    error,
  } = useAssetDetail(open ? assetId : null);
  const invalidate = useInvalidateAssets();
  const { data: assetInvoices = [] } = useAssetInvoices(open ? assetId : null);

  const [createSubOpen, setCreateSubOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);

  const handleToggleInUse = async (subAsset: Asset) => {
    const newInUse = !subAsset.inUse;
    await updateAsset(subAsset.id, {
      inUse: newInUse,
      retireDate: newInUse ? undefined : new Date().toISOString().split("T")[0],
    });
    void invalidate.invalidateDetail(assetId!);
    void invalidate.invalidateList();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="shrink-0">
          <div className="flex items-center gap-2">
            {detail?.parentId && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onNavigateToAsset(detail.parentId!)}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
            )}
            <SheetTitle className="truncate">
              {detail?.name ?? t("assets.detail.title")}
            </SheetTitle>
          </div>
        </SheetHeader>

        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-muted-foreground">
              {t("common.loading")}
            </span>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-destructive">
              {t("assets.errors.loadFailed")}
            </span>
          </div>
        )}

        {!isLoading && detail && (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-4">
            {/* Parent asset info for sub-assets */}
            {detail.parentId && detail.parentName && (
              <button
                type="button"
                className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent/50 transition-colors w-full"
                onClick={() => onNavigateToAsset(detail.parentId!)}
              >
                <ArrowUpIcon className="size-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs text-muted-foreground">
                    {t("assets.detail.parentAsset")}
                  </span>
                  <div className="flex items-center gap-2">
                    {detail.parentFirstPictureUrl && (
                      <AuthImg
                        url={detail.parentFirstPictureUrl}
                        className="size-6 rounded object-cover"
                      />
                    )}
                    <span className="text-sm font-medium truncate">
                      {detail.parentName}
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Status badges */}
            <div className="flex items-center gap-2">
              <Badge variant={detail.inUse ? "success" : "secondary"}>
                {detail.inUse
                  ? t("assets.filters.inUse")
                  : t("assets.filters.notInUse")}
              </Badge>
              {!detail.inUse && detail.retireDate && (
                <span className="text-xs text-muted-foreground">
                  {t("assets.form.retireDate")}: {formatDate(detail.retireDate)}
                </span>
              )}
              <Badge variant={warrantyBadgeVariant(detail.warrantyStatus)}>
                {t(`assets.warranty.${detail.warrantyStatus}`)}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {t("assets.columns.category")}: {detail.categoryName}
              </span>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("assets.columns.name")} value={detail.name} />
              <Field
                label={t("assets.columns.barcode")}
                value={detail.barcode}
              />
              <Field
                label={t("assets.columns.serialNumber")}
                value={detail.serialNumber}
              />
              <Field
                label={t("assets.columns.place")}
                value={detail.placeName}
              />
            </div>

            {/* Purchase info */}
            <div className="grid grid-cols-2 gap-4">
              <Field
                label={t("assets.form.price")}
                value={
                  detail.price != null ? formatCurrency(detail.price) : null
                }
              />
              <Field
                label={t("assets.form.shopDate")}
                value={detail.shopDate ? formatDate(detail.shopDate) : null}
              />
              <Field label={t("assets.form.store")} value={detail.storeName} />
            </div>

            {/* Warranty info */}
            {detail.hasWarranty && (
              <div className="grid gap-2">
                <h4 className="text-sm font-medium">
                  {t("assets.form.hasWarranty")}
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <Field
                    label={t("assets.form.activeDate")}
                    value={
                      detail.activeDate ? formatDate(detail.activeDate) : null
                    }
                  />
                  <Field
                    label={t("assets.form.warrantyPeriod")}
                    value={
                      detail.warrantyPeriod != null
                        ? `${detail.warrantyPeriod} ${t("assets.form.warrantyPeriodUnit")}`
                        : null
                    }
                  />
                  <Field
                    label={t("assets.form.expirationDate")}
                    value={
                      detail.expirationDate
                        ? formatDate(detail.expirationDate)
                        : null
                    }
                  />
                </div>
              </div>
            )}

            {/* Note */}
            {detail.note && (
              <div className="grid gap-1">
                <span className="text-xs text-muted-foreground">
                  {t("assets.form.note")}
                </span>
                <span className="text-sm whitespace-pre-wrap">
                  {detail.note}
                </span>
              </div>
            )}

            {/* Pictures */}
            <PictureManager
              pictures={detail.pictures ?? []}
              onSelect={async (files) => {
                await Promise.all(
                  files.map((f) => uploadAssetPicture(detail.id, undefined, f.id)),
                );
                void invalidate.invalidateDetail(assetId!);
              }}
              onDeselect={async (files) => {
                const pictures = detail.pictures ?? [];
                await Promise.all(
                  files
                    .map((f) => pictures.find((p) => p.fileId === f.id)?.id)
                    .filter((id): id is number => id != null)
                    .map((id) => deleteAssetPicture(detail.id, id)),
                );
                void invalidate.invalidateDetail(assetId!);
              }}
              onDelete={async (id) => {
                await deleteAssetPicture(detail.id, id);
                void invalidate.invalidateDetail(assetId!);
              }}
            />

            {/* Invoices */}
            <InvoiceBindingManager
              invoices={assetInvoices.map(
                (inv) =>
                  ({
                    id: inv.id,
                    invoiceId: inv.invoiceId,
                    invoiceNumber: inv.invoiceNumber,
                    invoiceDate: inv.invoiceDate,
                    totalAmount: inv.totalAmount,
                    sellerName: inv.sellerName,
                  }) satisfies BoundInvoice,
              )}
              title={t("common.invoices")}
              emptyLabel={t("common.noInvoices")}
              bindLabel={t("common.bind")}
              onBindInvoice={async (invoiceId) => {
                await bindInvoiceToAsset(assetId!, invoiceId);
                void invalidate.invalidateInvoices(assetId!);
              }}
              boundInvoiceIds={assetInvoices.map((i) => i.invoiceId)}
              uploadNewLabel={t("common.uploadNew")}
              onCreateInvoice={async (invoice) => {
                await bindInvoiceToAsset(assetId!, invoice.id);
                void invalidate.invalidateInvoices(assetId!);
              }}
              onUnbind={async (id) => {
                await unbindInvoiceFromAsset(assetId!, id);
                void invalidate.invalidateInvoices(assetId!);
              }}
              onInvoiceChanged={() => void invalidate.invalidateDetail(assetId!)}
            />

            {/* Attachments */}
            <AttachmentManager
              attachments={(detail.attachments ?? []).map((a) => ({
                id: a.id,
                fileId: a.fileId,
                filename: a.filename,
                fileSize: a.fileSize,
                url: a.url,
                indexed: a.indexed,
              }))}
              onSelect={async (file) => {
                await uploadAssetAttachment(detail.id, undefined, file.id);
                void invalidate.invalidateDetail(assetId!);
              }}
              onDelete={async (id) => {
                await deleteAssetAttachment(detail.id, id);
                void invalidate.invalidateDetail(assetId!);
              }}
            />

            {/* Sub-assets (for parent assets) */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {t("assets.subAssets.title")}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({detail.subAssets.length})
                  </span>
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateSubOpen(true)}
                >
                  <PlusIcon className="size-3.5" />
                  {t("assets.subAssets.add")}
                </Button>
              </div>

              {!isLoading && detail.subAssets.length === 0 && (
                <div className="rounded-lg border border-dashed p-4">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("assets.subAssets.empty")}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                {detail.subAssets.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    className="flex items-center justify-between w-full rounded-md border px-3 py-2 text-sm hover:bg-accent/50 transition-colors text-left"
                    onClick={() => onNavigateToAsset(sub.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {sub.firstPictureUrl ? (
                        <AuthImg
                          url={sub.firstPictureUrl}
                          className="size-8 rounded object-cover ring-1 ring-foreground/10"
                        />
                      ) : (
                        <div className="size-8 rounded bg-muted shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{sub.name}</div>
                        <div className="text-xs text-muted-foreground flex gap-2">
                          {sub.barcode && (
                            <span className="font-mono">{sub.barcode}</span>
                          )}
                          {sub.serialNumber && (
                            <span className="font-mono">
                              {sub.serialNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sub.price != null && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(sub.price)}
                        </span>
                      )}
                      <Badge
                        variant={warrantyBadgeVariant(sub.warrantyStatus)}
                        className="text-xs"
                      >
                        {t(`assets.warranty.${sub.warrantyStatus}`)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleToggleInUse(sub);
                        }}
                      >
                        {sub.inUse ? (
                          <ToggleRightIcon className="size-3.5" />
                        ) : (
                          <ToggleLeftIcon className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <Field
                label={t("common.createdAt")}
                value={detail.createdAt ? formatDate(detail.createdAt) : null}
              />
              <Field
                label={t("common.updatedAt")}
                value={detail.updatedAt ? formatDate(detail.updatedAt) : null}
              />
            </div>
          </div>
        )}

        {!isLoading && detail && (
          <SheetFooter className="shrink-0">
            <Button variant="outline" onClick={() => setEditingAsset(detail)}>
              <PencilIcon className="size-3.5" />
              {t("assets.edit")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeletingAsset(detail)}
            >
              <TrashIcon className="size-3.5" />
              {t("assets.delete")}
            </Button>
          </SheetFooter>
        )}

        {/* Nested dialogs */}
        <CreateAssetDialog
          open={createSubOpen}
          parentId={assetId ?? undefined}
          onClose={() => setCreateSubOpen(false)}
          onSuccess={() => {
            void invalidate.invalidateDetail(assetId!);
            void invalidate.invalidateList();
          }}
        />
        <EditAssetDialog
          open={!!editingAsset}
          asset={editingAsset}
          assetDetail={editingAsset ? (detail ?? undefined) : undefined}
          onClose={() => setEditingAsset(null)}
          onSuccess={() => {
            void invalidate.invalidateDetail(assetId!);
            void invalidate.invalidateList();
          }}
        />
        <DeleteAssetDialog
          open={!!deletingAsset}
          asset={deletingAsset}
          onClose={() => setDeletingAsset(null)}
          onSuccess={() => {
            setDeletingAsset(null);
            onClose();
            void invalidate.invalidateList();
          }}
        />

      </SheetContent>
    </Sheet>
  );
};

export default AssetDetailDrawer;
