import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ImageIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "lucide-react";
import type { Asset, AssetDetail, WarrantyStatus } from "@/api/assets";
import { getAssetById, updateAsset } from "@/api/assets";
import type { AssetCategory } from "@/api/assetCategories";
import type { AssetPlace } from "@/api/assetPlaces";
import type { AssetStore } from "@/api/assetStores";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import AssetPictureManager from "./AssetPictureManager";
import CreateAssetDialog from "./CreateAssetDialog";
import EditAssetDialog from "./EditAssetDialog";
import DeleteAssetDialog from "./DeleteAssetDialog";

interface AssetExpandedRowProps {
  readonly asset: Asset;
  readonly colSpan: number;
  readonly onAssetUpdated: () => void;
  readonly categories: AssetCategory[];
  readonly places: AssetPlace[];
  readonly stores: AssetStore[];
  readonly onRefDataChanged: () => void;
}

const warrantyStatusBadge = (
  status: WarrantyStatus,
): { label: string; variant: "success" | "destructive" | "secondary" } => {
  switch (status) {
    case "IN_WARRANTY":
      return { label: "IN_WARRANTY", variant: "success" };
    case "OUT_WARRANTY":
      return { label: "OUT_WARRANTY", variant: "destructive" };
    case "NO_WARRANTY":
      return { label: "NO_WARRANTY", variant: "secondary" };
  }
};

const AssetExpandedRow = ({
  asset,
  colSpan,
  onAssetUpdated,
  categories,
  places,
  stores,
  onRefDataChanged,
}: AssetExpandedRowProps) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPictures, setShowPictures] = useState(false);
  const [createSubOpen, setCreateSubOpen] = useState(false);
  const [editingSubAsset, setEditingSubAsset] = useState<Asset | null>(null);
  const [deletingSubAsset, setDeletingSubAsset] = useState<Asset | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const { data } = await getAssetById(asset.id);
      setDetail(data);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    void fetchDetail();
  });

  const handleSubAssetChanged = () => {
    void fetchDetail();
    onAssetUpdated();
  };

  const handleToggleInUse = async (subAsset: Asset) => {
    await updateAsset(subAsset.id, { isInUse: !subAsset.isInUse });
    handleSubAssetChanged();
  };

  const subAssets = detail?.subAssets ?? [];

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="bg-muted/30 p-4">
        <div className="grid gap-4">
          {detail && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              {detail.note && (
                <div className="col-span-3">
                  <span className="text-muted-foreground">{t("assets.form.note")}: </span>
                  {detail.note}
                </div>
              )}
              {detail.shopDate && (
                <div>
                  <span className="text-muted-foreground">{t("assets.form.shopDate")}: </span>
                  {formatDate(detail.shopDate)}
                </div>
              )}
              {detail.storeName && (
                <div>
                  <span className="text-muted-foreground">{t("assets.form.store")}: </span>
                  {detail.storeName}
                </div>
              )}
              {detail.price != null && (
                <div>
                  <span className="text-muted-foreground">{t("assets.form.price")}: </span>
                  {detail.price}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{t("assets.subAssets.title")}</h4>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPictures(!showPictures)}
              >
                <ImageIcon className="size-3.5" />
                {t("assets.pictures.manage")}
              </Button>
              <Button size="sm" onClick={() => setCreateSubOpen(true)}>
                <PlusIcon className="size-3.5" />
                {t("assets.subAssets.add")}
              </Button>
            </div>
          </div>

          {showPictures && <AssetPictureManager assetId={asset.id} />}

          <div className="rounded-lg ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("assets.columns.name")}</TableHead>
                  <TableHead>{t("assets.columns.barcode")}</TableHead>
                  <TableHead>{t("assets.columns.serialNumber")}</TableHead>
                  <TableHead>{t("assets.columns.inUse")}</TableHead>
                  <TableHead>{t("assets.columns.warranty")}</TableHead>
                  <TableHead className="text-right">
                    {t("assets.columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-16 text-center">
                      {t("common.loading")}
                    </TableCell>
                  </TableRow>
                )}
                {!loading && subAssets.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-16 text-center text-muted-foreground"
                    >
                      {t("assets.subAssets.empty")}
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  subAssets.map((sub) => {
                    const wb = warrantyStatusBadge(sub.warrantyStatus);
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {sub.barcode ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {sub.serialNumber ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleToggleInUse(sub)}
                          >
                            {sub.isInUse ? (
                              <ToggleRightIcon className="size-3.5" />
                            ) : (
                              <ToggleLeftIcon className="size-3.5" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant={wb.variant}>
                            {t(`assets.warranty.${wb.label}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setEditingSubAsset(sub)}
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setDeletingSubAsset(sub)}
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

        <CreateAssetDialog
          open={createSubOpen}
          categories={categories}
          places={places}
          stores={stores}
          parentId={asset.id}
          onClose={() => setCreateSubOpen(false)}
          onSuccess={handleSubAssetChanged}
          onRefDataChanged={onRefDataChanged}
        />
        <EditAssetDialog
          open={!!editingSubAsset}
          asset={editingSubAsset}
          categories={categories}
          places={places}
          stores={stores}
          onClose={() => setEditingSubAsset(null)}
          onSuccess={handleSubAssetChanged}
          onRefDataChanged={onRefDataChanged}
        />
        <DeleteAssetDialog
          open={!!deletingSubAsset}
          asset={deletingSubAsset}
          onClose={() => setDeletingSubAsset(null)}
          onSuccess={handleSubAssetChanged}
        />
      </TableCell>
    </TableRow>
  );
};

export default AssetExpandedRow;
