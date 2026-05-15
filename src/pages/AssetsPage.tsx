import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  MapPinIcon,
  StoreIcon,
  TagIcon,
  ReceiptTextIcon,
} from "lucide-react";
import type { Asset, WarrantyStatus, Page } from "@/api/assets";
import { formatCurrency, formatDate } from "@/lib/utils";
import AuthImg from "@/components/AuthImg";
import ImagePreview from "@/components/ImagePreview";
import { useDebounce } from "@/hooks/useDebounce";
import { useAssetCategories } from "@/hooks/queries/useAssetCategories";
import { useAssetPlaces } from "@/hooks/queries/useAssetPlaces";
import { useAssets } from "@/hooks/queries/useAssets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectPopup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import CreateAssetDialog from "@/components/assets/CreateAssetDialog";
import EditAssetDialog from "@/components/assets/EditAssetDialog";
import DeleteAssetDialog from "@/components/assets/DeleteAssetDialog";
import AssetDetailDrawer from "@/components/assets/AssetDetailDrawer";
import AssetPlaceManagerDialog from "@/components/assets/AssetPlaceManagerDialog";
import AssetStoreManagerDialog from "@/components/assets/AssetStoreManagerDialog";
import AssetCategoryManagerDialog from "@/components/assets/AssetCategoryManagerDialog";

import { Pagination, PAGE_SIZE_OPTIONS } from "@/components/ui/pagination";

const WARRANTY_OPTIONS: WarrantyStatus[] = [
  "IN_WARRANTY",
  "OUT_WARRANTY",
  "NO_WARRANTY",
];

const EMPTY_PAGE: Page<Asset> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE_OPTIONS[0],
  number: 0,
  first: true,
  last: true,
  empty: true,
};

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

const AssetsPage = () => {
  const { t } = useTranslation();

  const { data: categories = [] } = useAssetCategories();
  const { data: places = [] } = useAssetPlaces();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [filterPlaceId, setFilterPlaceId] = useState<number | null>(null);
  const [filterIsInUse, setFilterIsInUse] = useState<boolean | null>(null);
  const [filterWarrantyStatus, setFilterWarrantyStatus] =
    useState<WarrantyStatus | null>(null);
  const [filterParentOnly, setFilterParentOnly] = useState<boolean | null>(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const { data: pageData, isLoading } = useAssets({
    search: debouncedSearch,
    categoryId: filterCategoryId,
    placeId: filterPlaceId,
    isInUse: filterIsInUse,
    warrantyStatus: filterWarrantyStatus,
    parentOnly: filterParentOnly,
    page,
    size: pageSize,
  });

  const data = pageData ?? EMPTY_PAGE;

  const [createOpen, setCreateOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [drawerAssetId, setDrawerAssetId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [placeManagerOpen, setPlaceManagerOpen] = useState(false);
  const [storeManagerOpen, setStoreManagerOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleOpenDrawer = (assetId: number) => {
    setDrawerAssetId(assetId);
    setDrawerOpen(true);
  };

  const handleNavigateToAsset = (assetId: number) => {
    setDrawerAssetId(assetId);
  };

  const totalPages = data.totalPages;
  const currentPage = data.number;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("assets.search")}
            className="pl-8"
          />
        </div>

        <div className="w-40">
          <Select
            value={filterCategoryId}
            onValueChange={(v) => {
              setFilterCategoryId(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("assets.filters.allCategories")}>
                {() =>
                  filterCategoryId == null
                    ? t("assets.filters.allCategories")
                    : (categories.find((c) => c.id === filterCategoryId)
                        ?.name ?? t("assets.filters.allCategories"))
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("assets.filters.allCategories")}
              </SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={filterPlaceId}
            onValueChange={(v) => {
              setFilterPlaceId(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("assets.filters.allPlaces")}>
                {() =>
                  filterPlaceId == null
                    ? t("assets.filters.allPlaces")
                    : (places.find((p) => p.id === filterPlaceId)?.name ??
                      t("assets.filters.allPlaces"))
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("assets.filters.allPlaces")}
              </SelectItem>
              {places.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={filterIsInUse}
            onValueChange={(v) => {
              setFilterIsInUse(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("assets.filters.allInUse")}>
                {() =>
                  filterIsInUse == null
                    ? t("assets.filters.allInUse")
                    : filterIsInUse
                      ? t("assets.filters.inUse")
                      : t("assets.filters.notInUse")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("assets.filters.allInUse")}
              </SelectItem>
              <SelectItem value={true}>{t("assets.filters.inUse")}</SelectItem>
              <SelectItem value={false}>
                {t("assets.filters.notInUse")}
              </SelectItem>
            </SelectPopup>
          </Select>
        </div>

        <div className="w-44">
          <Select
            value={filterWarrantyStatus}
            onValueChange={(v) => {
              setFilterWarrantyStatus(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("assets.filters.allWarrantyStatus")}>
                {() =>
                  filterWarrantyStatus == null
                    ? t("assets.filters.allWarrantyStatus")
                    : t(`assets.warranty.${filterWarrantyStatus}`)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("assets.filters.allWarrantyStatus")}
              </SelectItem>
              {WARRANTY_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`assets.warranty.${s}`)}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={filterParentOnly}
            onValueChange={(v) => {
              setFilterParentOnly(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("assets.filters.parentOnly")}>
                {() =>
                  filterParentOnly === false
                    ? t("assets.filters.allAssets")
                    : t("assets.filters.parentOnly")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={true}>
                {t("assets.filters.parentOnly")}
              </SelectItem>
              <SelectItem value={false}>
                {t("assets.filters.allAssets")}
              </SelectItem>
            </SelectPopup>
          </Select>
        </div>

        <div className="ml-auto flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCategoryManagerOpen(true)}
          >
            <TagIcon className="size-3.5" />
            {t("assets.assetCategories.manage")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPlaceManagerOpen(true)}
          >
            <MapPinIcon className="size-3.5" />
            {t("assets.assetPlaces.manage")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStoreManagerOpen(true)}
          >
            <StoreIcon className="size-3.5" />
            {t("assets.assetStores.manage")}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            {t("assets.create")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>{t("assets.columns.name")}</TableHead>
              <TableHead>{t("assets.columns.barcode")}</TableHead>
              <TableHead>{t("assets.columns.serialNumber")}</TableHead>
              <TableHead>{t("assets.columns.category")}</TableHead>
              <TableHead>{t("assets.columns.place")}</TableHead>
              <TableHead className="text-right">
                {t("assets.columns.price")}
              </TableHead>
              <TableHead className="text-right">
                {t("assets.columns.totalPrice")}
              </TableHead>
              <TableHead>{t("assets.columns.inUse")}</TableHead>
              <TableHead>{t("assets.columns.retireDate")}</TableHead>
              <TableHead>{t("assets.columns.warranty")}</TableHead>
              <TableHead className="text-right">
                {t("assets.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data.content.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("common.noResults")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              data.content.map((asset) => (
                <TableRow
                  key={asset.id}
                  className="cursor-pointer"
                  onClick={() => handleOpenDrawer(asset.id)}
                >
                  <TableCell>
                    {asset.firstPictureUrl ? (
                      <div
                        className="size-8 shrink-0 cursor-pointer overflow-hidden rounded ring-1 ring-foreground/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUrl(asset.firstPictureUrl);
                        }}
                      >
                        <AuthImg
                          url={asset.firstPictureUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="size-8 shrink-0 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {asset.barcode ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {asset.serialNumber ?? "—"}
                  </TableCell>
                  <TableCell>{asset.categoryName}</TableCell>
                  <TableCell>{asset.placeName}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {asset.price != null ? formatCurrency(asset.price) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      {formatCurrency(asset.totalPrice)}
                      {asset.hasInvoice && (
                        <ReceiptTextIcon className="size-3.5 text-muted-foreground" />
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={asset.inUse ? "success" : "secondary"}>
                      {asset.inUse
                        ? t("assets.filters.inUse")
                        : t("assets.filters.notInUse")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {asset.retireDate ? formatDate(asset.retireDate) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={warrantyBadgeVariant(asset.warrantyStatus)}>
                      {t(`assets.warranty.${asset.warrantyStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAsset(asset);
                        }}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingAsset(asset);
                        }}
                      >
                        <TrashIcon className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
      />

      <CreateAssetDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <EditAssetDialog
        open={!!editingAsset}
        asset={editingAsset}
        onClose={() => setEditingAsset(null)}
        onSuccess={() => {}}
      />
      <DeleteAssetDialog
        open={!!deletingAsset}
        asset={deletingAsset}
        onClose={() => setDeletingAsset(null)}
      />
      <AssetDetailDrawer
        assetId={drawerAssetId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerAssetId(null);
        }}
        onNavigateToAsset={handleNavigateToAsset}
      />
      <AssetCategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />
      <AssetPlaceManagerDialog
        open={placeManagerOpen}
        onClose={() => setPlaceManagerOpen(false)}
      />
      <AssetStoreManagerDialog
        open={storeManagerOpen}
        onClose={() => setStoreManagerOpen(false)}
      />
      <ImagePreview
        url={previewUrl}
        open={!!previewUrl}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
      />
    </div>
  );
};

export default AssetsPage;
