import { Fragment, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TagIcon,
  BuildingIcon,
} from "lucide-react";
import {
  getGoods,
  type Good,
  type GoodStatus,
  type ItemStatus,
  type Page,
} from "@/api/goods";
import AuthImg from "@/components/AuthImg";
import ImagePreview from "@/components/ImagePreview";
import { useDebounce } from "@/hooks/useDebounce";
import { getGoodCategories, type GoodCategory } from "@/api/goodCategories";
import { getGoodBrands, type GoodBrand } from "@/api/goodBrands";
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
import CreateGoodDialog from "@/components/expiration/CreateGoodDialog";
import EditGoodDialog from "@/components/expiration/EditGoodDialog";
import DeleteGoodDialog from "@/components/expiration/DeleteGoodDialog";
import GoodExpandedRow from "@/components/expiration/GoodExpandedRow";
import CategoryManagerDialog from "@/components/expiration/CategoryManagerDialog";
import BrandManagerDialog from "@/components/expiration/BrandManagerDialog";

import { Pagination, PAGE_SIZE_OPTIONS } from "@/components/ui/pagination";

const STATUS_OPTIONS: ItemStatus[] = [
  "EXPIRED",
  "EXPIRING_SOON",
  "IN_USE",
  "EXHAUSTED",
];

const goodStatusBadgeVariant = (
  status: GoodStatus,
): "success" | "secondary" => {
  switch (status) {
    case "IN_USE":
      return "success";
    case "NOT_IN_USE":
      return "secondary";
  }
};

const ExpirationPage = () => {
  const { t } = useTranslation();

  const [pageData, setPageData] = useState<Page<Good>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: PAGE_SIZE_OPTIONS[0],
    number: 0,
    first: true,
    last: true,
    empty: true,
  });
  const [categories, setCategories] = useState<GoodCategory[]>([]);
  const [brands, setBrands] = useState<GoodBrand[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [filterBrandId, setFilterBrandId] = useState<number | null>(null);
  const [filterItemStatus, setFilterItemStatus] = useState<ItemStatus | null>(
    null,
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingGood, setEditingGood] = useState<Good | null>(null);
  const [deletingGood, setDeletingGood] = useState<Good | null>(null);
  const [expandedGoodId, setExpandedGoodId] = useState<number | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [brandManagerOpen, setBrandManagerOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle goodId query param from search navigation (expand good detail)
  useEffect(() => {
    const goodIdParam = searchParams.get("goodId");
    if (goodIdParam) {
      const id = Number(goodIdParam);
      if (!Number.isNaN(id)) {
        setExpandedGoodId(id);
        const next = new URLSearchParams(searchParams);
        next.delete("goodId");
        const query = next.toString();
        navigate(query ? `/expiration?${query}` : "/expiration", { replace: true });
      }
    }
  }, []);

  const fetchRefData = useCallback(async () => {
    const [catRes, brandRes] = await Promise.all([
      getGoodCategories(),
      getGoodBrands(),
    ]);
    setCategories(catRes.data);
    setBrands(brandRes.data);
  }, []);

  const fetchGoods = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getGoods({
        search: debouncedSearch || undefined,
        categoryId: filterCategoryId ?? undefined,
        brandId: filterBrandId ?? undefined,
        itemStatus: filterItemStatus ?? undefined,
        page,
        size: pageSize,
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
    filterBrandId,
    filterItemStatus,
    page,
    pageSize,
  ]);

  useEffect(() => {
    void fetchRefData();
  }, [fetchRefData]);

  useEffect(() => {
    void fetchGoods();
  }, [fetchGoods]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleNavigateToGood = (goodId: number) => {
    setSearch("");
    setFilterCategoryId(null);
    setFilterBrandId(null);
    setFilterItemStatus(null);
    setPage(0);
    setExpandedGoodId(goodId);
  };

  const handleRefDataChanged = () => {
    void fetchRefData();
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
            placeholder={t("goods.search")}
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
              <SelectValue placeholder={t("goods.filters.allCategories")}>
                {() =>
                  filterCategoryId == null
                    ? t("goods.filters.allCategories")
                    : (categories.find((c) => c.id === filterCategoryId)
                        ?.name ?? t("goods.filters.allCategories"))
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("goods.filters.allCategories")}
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
            value={filterBrandId}
            onValueChange={(v) => {
              setFilterBrandId(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("goods.filters.allBrands")}>
                {() =>
                  filterBrandId == null
                    ? t("goods.filters.allBrands")
                    : (brands.find((b) => b.id === filterBrandId)?.brandName ??
                      t("goods.filters.allBrands"))
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("goods.filters.allBrands")}
              </SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.brandName}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={filterItemStatus}
            onValueChange={(v) => {
              setFilterItemStatus(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("goods.filters.allStatuses")}>
                {() =>
                  filterItemStatus == null
                    ? t("goods.filters.allStatuses")
                    : t(`goods.status.${filterItemStatus}`)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("goods.filters.allStatuses")}
              </SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`goods.status.${s}`)}
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
            {t("goods.categories.manage")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBrandManagerOpen(true)}
          >
            <BuildingIcon className="size-3.5" />
            {t("goods.brands.manage")}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            {t("goods.create")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="w-12" />
              <TableHead>{t("goods.columns.productName")}</TableHead>
              <TableHead>{t("goods.columns.barcode")}</TableHead>
              <TableHead>{t("goods.columns.category")}</TableHead>
              <TableHead>{t("goods.columns.brand")}</TableHead>
              <TableHead>{t("goods.columns.items")}</TableHead>
              <TableHead>{t("goods.columns.status")}</TableHead>
              <TableHead className="text-right">
                {t("goods.columns.actions")}
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
              pageData.content.map((good) => (
                <Fragment key={good.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          setExpandedGoodId(
                            expandedGoodId === good.id ? null : good.id,
                          )
                        }
                      >
                        {expandedGoodId === good.id ? (
                          <ChevronUpIcon className="size-3.5" />
                        ) : (
                          <ChevronDownIcon className="size-3.5" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {good.firstPictureUrl ? (
                        <div
                          className="size-8 shrink-0 cursor-pointer overflow-hidden rounded ring-1 ring-foreground/10"
                          onClick={() => setPreviewUrl(good.firstPictureUrl)}
                        >
                          <AuthImg
                            url={good.firstPictureUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="size-8 shrink-0 rounded bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {good.productName}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {good.barcode}
                    </TableCell>
                    <TableCell>{good.categoryName}</TableCell>
                    <TableCell>{good.brandName}</TableCell>
                    <TableCell>
                      <span className="tabular-nums">
                        {good.itemCountInUse}/{good.itemCountTotal}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={goodStatusBadgeVariant(good.status)}>
                        {t(`goods.status.${good.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setEditingGood(good)}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeletingGood(good)}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedGoodId === good.id && (
                    <GoodExpandedRow
                      good={good}
                      colSpan={9}
                      onGoodUpdated={fetchGoods}
                      itemStatus={filterItemStatus}
                    />
                  )}
                </Fragment>
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

      <CreateGoodDialog
        open={createOpen}
        categories={categories}
        brands={brands}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchGoods}
        onNavigateToGood={handleNavigateToGood}
        onRefDataChanged={handleRefDataChanged}
      />
      <EditGoodDialog
        open={!!editingGood}
        good={editingGood}
        categories={categories}
        brands={brands}
        onClose={() => setEditingGood(null)}
        onSuccess={fetchGoods}
        onRefDataChanged={handleRefDataChanged}
      />
      <DeleteGoodDialog
        open={!!deletingGood}
        good={deletingGood}
        onClose={() => setDeletingGood(null)}
        onSuccess={fetchGoods}
      />
      <CategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        onChanged={handleRefDataChanged}
      />
      <BrandManagerDialog
        open={brandManagerOpen}
        onClose={() => setBrandManagerOpen(false)}
        onChanged={handleRefDataChanged}
      />
      <ImagePreview
        url={previewUrl}
        open={!!previewUrl}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
      />
    </div>
  );
};

export default ExpirationPage;
