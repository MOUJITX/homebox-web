import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  StoreIcon,
  TagIcon,
} from "lucide-react";
import { getAssets, type Asset, type WarrantyStatus, type Page } from "@/api/assets";
import AuthImg from "@/components/AuthImg";
import { useDebounce } from "@/hooks/useDebounce";
import { getAssetCategories, type AssetCategory } from "@/api/assetCategories";
import { getAssetPlaces, type AssetPlace } from "@/api/assetPlaces";
import { getAssetStores, type AssetStore } from "@/api/assetStores";
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

const PAGE_SIZE = 10;

const WARRANTY_OPTIONS: WarrantyStatus[] = [
  "IN_WARRANTY",
  "OUT_WARRANTY",
  "NO_WARRANTY",
];

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

  const [pageData, setPageData] = useState<Page<Asset>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: PAGE_SIZE,
    number: 0,
    first: true,
    last: true,
    empty: true,
  });
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [places, setPlaces] = useState<AssetPlace[]>([]);
  const [stores, setStores] = useState<AssetStore[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [filterPlaceId, setFilterPlaceId] = useState<number | null>(null);
  const [filterIsInUse, setFilterIsInUse] = useState<boolean | null>(null);
  const [filterWarrantyStatus, setFilterWarrantyStatus] =
    useState<WarrantyStatus | null>(null);
  const [page, setPage] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [drawerAssetId, setDrawerAssetId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [placeManagerOpen, setPlaceManagerOpen] = useState(false);
  const [storeManagerOpen, setStoreManagerOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const fetchRefData = useCallback(async () => {
    const [catRes, placeRes, storeRes] = await Promise.all([
      getAssetCategories(),
      getAssetPlaces(),
      getAssetStores(),
    ]);
    setCategories(catRes.data);
    setPlaces(placeRes.data);
    setStores(storeRes.data);
  }, []);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAssets({
        search: debouncedSearch || undefined,
        categoryId: filterCategoryId ?? undefined,
        placeId: filterPlaceId ?? undefined,
        isInUse: filterIsInUse ?? undefined,
        warrantyStatus: filterWarrantyStatus ?? undefined,
        page,
        size: PAGE_SIZE,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      setPageData(data);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    filterCategoryId,
    filterPlaceId,
    filterIsInUse,
    filterWarrantyStatus,
    page,
  ]);

  useEffect(() => {
    void fetchRefData();
  }, [fetchRefData]);

  useEffect(() => {
    void fetchAssets();
  }, [fetchAssets]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleRefDataChanged = () => {
    void fetchRefData();
  };

  const handleOpenDrawer = (assetId: number) => {
    setDrawerAssetId(assetId);
    setDrawerOpen(true);
  };

  const handleNavigateToAsset = (assetId: number) => {
    setDrawerAssetId(assetId);
  };

  const totalPages = pageData.totalPages;
  const currentPage = pageData.number;

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
              <SelectItem value={null}>{t("assets.filters.allInUse")}</SelectItem>
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
                <TableCell colSpan={9} className="h-24 text-center">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && pageData.content.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("common.noResults")}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              pageData.content.map((asset) => (
                <TableRow
                  key={asset.id}
                  className="cursor-pointer"
                  onClick={() => handleOpenDrawer(asset.id)}
                >
                  <TableCell>
                    {asset.firstPictureUrl ? (
                      <AuthImg
                        url={asset.firstPictureUrl}
                        alt=""
                        className="size-8 rounded object-cover ring-1 ring-foreground/10"
                      />
                    ) : (
                      <div className="size-8 rounded bg-muted" />
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
                  <TableCell>
                    <Badge variant={asset.inUse ? "success" : "secondary"}>
                      {asset.inUse
                        ? t("assets.filters.inUse")
                        : t("assets.filters.notInUse")}
                    </Badge>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("common.pageInfo", {
              current: currentPage + 1,
              total: totalPages,
            })}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pageData.first}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pageData.last}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <CreateAssetDialog
        open={createOpen}
        categories={categories}
        places={places}
        stores={stores}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchAssets}
        onRefDataChanged={handleRefDataChanged}
      />
      <EditAssetDialog
        open={!!editingAsset}
        asset={editingAsset}
        categories={categories}
        places={places}
        stores={stores}
        onClose={() => setEditingAsset(null)}
        onSuccess={fetchAssets}
        onRefDataChanged={handleRefDataChanged}
      />
      <DeleteAssetDialog
        open={!!deletingAsset}
        asset={deletingAsset}
        onClose={() => setDeletingAsset(null)}
        onSuccess={fetchAssets}
      />
      <AssetDetailDrawer
        assetId={drawerAssetId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerAssetId(null);
        }}
        onNavigateToAsset={handleNavigateToAsset}
        onRefresh={fetchAssets}
        categories={categories}
        places={places}
        stores={stores}
        onRefDataChanged={handleRefDataChanged}
      />
      <AssetCategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        onChanged={handleRefDataChanged}
      />
      <AssetPlaceManagerDialog
        open={placeManagerOpen}
        onClose={() => setPlaceManagerOpen(false)}
        onChanged={handleRefDataChanged}
      />
      <AssetStoreManagerDialog
        open={storeManagerOpen}
        onClose={() => setStoreManagerOpen(false)}
        onChanged={handleRefDataChanged}
      />
    </div>
  );
};

export default AssetsPage;
