import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "lucide-react";
import {
  getGoodById,
  type Good,
  type GoodDetail,
  type GoodItem,
} from "@/api/goods";
import { getGoodCategories, type GoodCategory } from "@/api/goodCategories";
import { getGoodBrands, type GoodBrand } from "@/api/goodBrands";
import { updateGoodItem } from "@/api/goodItems";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import PictureManager from "@/components/shared/PictureManager";
import AttachmentManager from "@/components/shared/AttachmentManager";
import { uploadGoodPicture, deleteGoodPicture } from "@/api/goodPictures";
import {
  uploadGoodAttachment,
  deleteGoodAttachment,
} from "@/api/goodAttachments";
import CreateItemDialog from "./CreateItemDialog";
import EditItemDialog from "./EditItemDialog";
import DeleteItemDialog from "./DeleteItemDialog";
import EditGoodDialog from "./EditGoodDialog";
import DeleteGoodDialog from "./DeleteGoodDialog";

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

const isExpired = (item: GoodItem) =>
  item.expirationDate && new Date(item.expirationDate) < new Date();

const isExpiringSoon = (item: GoodItem, expiringSoonDays: number) => {
  if (!item.expirationDate) return false;
  const now = new Date();
  const expDate = new Date(item.expirationDate);
  const diffDays = Math.ceil(
    (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays > 0 && diffDays <= expiringSoonDays;
};

const getItemStatus = (
  item: GoodItem,
  expiringSoonDays: number,
): {
  label: string;
  variant: "secondary" | "destructive" | "warning" | "success";
} => {
  if (!item.inUse) return { label: "EXHAUSTED", variant: "secondary" };
  if (isExpired(item)) return { label: "EXPIRED", variant: "destructive" };
  if (isExpiringSoon(item, expiringSoonDays))
    return { label: "EXPIRING_SOON", variant: "warning" };
  return { label: "IN_USE", variant: "success" };
};

interface GoodDetailDrawerProps {
  readonly goodId: number | null;
  readonly open: boolean;
  readonly onClose: () => void;
}

const GoodDetailDrawer = ({ goodId, open, onClose }: GoodDetailDrawerProps) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<GoodDetail | null>(null);
  const [categories, setCategories] = useState<GoodCategory[]>([]);
  const [brands, setBrands] = useState<GoodBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GoodItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<GoodItem | null>(null);
  const [editingGood, setEditingGood] = useState<Good | null>(null);
  const [deletingGood, setDeletingGood] = useState<Good | null>(null);

  const fetchDetail = useCallback(async () => {
    if (goodId == null) return;
    setLoading(true);
    setError(false);
    try {
      const { data } = await getGoodById(goodId);
      setDetail(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [goodId]);

  const fetchRefData = useCallback(async () => {
    const [catRes, brandRes] = await Promise.all([
      getGoodCategories(),
      getGoodBrands(),
    ]);
    setCategories(catRes.data);
    setBrands(brandRes.data);
  }, []);

  useEffect(() => {
    if (open) {
      void fetchDetail();
      void fetchRefData();
    } else {
      setDetail(null);
    }
  }, [open, fetchDetail, fetchRefData]);

  const handleItemChanged = () => {
    void fetchDetail();
  };

  const handleToggleInUse = async (item: GoodItem) => {
    await updateGoodItem(goodId!, item.id, { inUse: !item.inUse });
    handleItemChanged();
  };

  const handleGoodSaved = () => {
    void fetchDetail();
  };

  const handleGoodDeleted = () => {
    setDeletingGood(null);
    onClose();
  };

  const handleRefDataChanged = () => {
    void fetchRefData();
  };

  const handleClose = () => {
    setDetail(null);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="truncate">
            {detail?.productName ?? t("goods.detail.title")}
          </SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-muted-foreground">
              {t("common.loading")}
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-destructive">
              {t("goods.errors.loadFailed")}
            </span>
          </div>
        )}

        {!loading && detail && (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-4">
            {/* Status badges */}
            <div className="flex items-center gap-2">
              <Badge
                variant={detail.itemCountInUse > 0 ? "success" : "secondary"}
              >
                {t(`goods.status.${detail.status}`)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {detail.itemCountInUse}/{detail.itemCountTotal}{" "}
                {t("goods.columns.items")}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {t("goods.columns.category")}: {detail.categoryName}
              </span>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <Field
                label={t("goods.columns.productName")}
                value={detail.productName}
              />
              <Field
                label={t("goods.columns.barcode")}
                value={detail.barcode}
              />
              <Field
                label={t("goods.columns.category")}
                value={detail.categoryName}
              />
              <Field
                label={t("goods.columns.brand")}
                value={detail.brandName}
              />
            </div>

            {/* Items */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("goods.items.title")}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({detail.items.length})
                  </span>
                </span>
                <Button size="sm" onClick={() => setCreateItemOpen(true)}>
                  <PlusIcon className="size-3.5" />
                  {t("goods.items.add")}
                </Button>
              </div>

              <div className="rounded-lg border border-foreground/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t("goods.items.columns.productDate")}
                      </TableHead>
                      <TableHead>
                        {t("goods.items.columns.expirationDate")}
                      </TableHead>
                      <TableHead>{t("goods.items.columns.lifeDays")}</TableHead>
                      <TableHead>{t("goods.items.columns.status")}</TableHead>
                      <TableHead className="text-right">
                        {t("goods.items.columns.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.items.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-16 text-center text-muted-foreground"
                        >
                          {t("goods.items.empty")}
                        </TableCell>
                      </TableRow>
                    )}
                    {detail.items.map((item) => {
                      const status = getItemStatus(
                        item,
                        detail.expiringSoonDays,
                      );
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(item.productDate)}</TableCell>
                          <TableCell>
                            {formatDate(item.expirationDate)}
                          </TableCell>
                          <TableCell>{item.lifeDays}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {t(`goods.status.${status.label}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleToggleInUse(item)}
                              >
                                {item.inUse ? (
                                  <ToggleRightIcon className="size-3.5" />
                                ) : (
                                  <ToggleLeftIcon className="size-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setEditingItem(item)}
                              >
                                <PencilIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setDeletingItem(item)}
                              >
                                <TrashIcon className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pictures */}
            <PictureManager
              pictures={detail.pictures ?? []}
              title={t("shared.pictures.title")}
              uploadLabel={t("shared.pictures.upload")}
              uploadingLabel={t("shared.pictures.uploading")}
              emptyLabel={t("shared.pictures.empty")}
              onUpload={async (files) => {
                await Promise.all(
                  files.map((file) => uploadGoodPicture(detail.id, file)),
                );
                void fetchDetail();
              }}
              onDelete={async (id) => {
                await deleteGoodPicture(detail.id, id);
                void fetchDetail();
              }}
            />

            {/* Attachments */}
            <AttachmentManager
              attachments={(detail.attachments ?? []).map((a) => ({
                id: a.id,
                filename: a.filename,
                fileSize: a.fileSize,
                url: a.url,
                indexed: a.indexed,
              }))}
              title={t("shared.attachments.title")}
              uploadLabel={t("shared.attachments.upload")}
              uploadingLabel={t("shared.attachments.uploading")}
              emptyLabel={t("shared.attachments.empty")}
              indexingLabel={t("shared.attachments.indexing")}
              onUpload={async (file) => {
                await uploadGoodAttachment(detail.id, file);
                void fetchDetail();
              }}
              onDelete={async (id) => {
                await deleteGoodAttachment(detail.id, id);
                void fetchDetail();
              }}
            />

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <Field
                label={t("goods.detail.createdAt")}
                value={detail.createdAt ? formatDate(detail.createdAt) : null}
              />
              <Field
                label={t("goods.detail.updatedAt")}
                value={detail.updatedAt ? formatDate(detail.updatedAt) : null}
              />
            </div>
          </div>
        )}

        {!loading && detail && (
          <SheetFooter className="shrink-0">
            <Button variant="outline" onClick={() => setEditingGood(detail)}>
              <PencilIcon className="size-3.5" />
              {t("goods.edit")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeletingGood(detail)}
            >
              <TrashIcon className="size-3.5" />
              {t("goods.delete")}
            </Button>
          </SheetFooter>
        )}

        {/* Nested dialogs */}
        <CreateItemDialog
          open={createItemOpen}
          goodId={goodId ?? 0}
          goodName={detail?.productName ?? ""}
          onClose={() => setCreateItemOpen(false)}
          onSuccess={handleItemChanged}
        />
        <EditItemDialog
          open={!!editingItem}
          goodId={goodId ?? 0}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={handleItemChanged}
        />
        <DeleteItemDialog
          open={!!deletingItem}
          goodId={goodId ?? 0}
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onSuccess={handleItemChanged}
        />
        <EditGoodDialog
          open={!!editingGood}
          good={editingGood}
          categories={categories}
          brands={brands}
          onClose={() => setEditingGood(null)}
          onSuccess={handleGoodSaved}
          onRefDataChanged={handleRefDataChanged}
        />
        <DeleteGoodDialog
          open={!!deletingGood}
          good={deletingGood}
          onClose={() => setDeletingGood(null)}
          onSuccess={handleGoodDeleted}
        />
      </SheetContent>
    </Sheet>
  );
};

export default GoodDetailDrawer;
