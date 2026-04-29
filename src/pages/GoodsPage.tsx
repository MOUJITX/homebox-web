import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TagIcon,
  BuildingIcon,
} from "lucide-react";
import {
  getGoods,
  type Good,
  type GoodStatus,
  type Page,
} from "@/api/goods";
import {
  getGoodCategories,
  type GoodCategory,
} from "@/api/goodCategories";
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
import CreateGoodDialog from "@/components/goods/CreateGoodDialog";
import EditGoodDialog from "@/components/goods/EditGoodDialog";
import DeleteGoodDialog from "@/components/goods/DeleteGoodDialog";
import GoodExpandedRow from "@/components/goods/GoodExpandedRow";
import CategoryManagerDialog from "@/components/goods/CategoryManagerDialog";
import BrandManagerDialog from "@/components/goods/BrandManagerDialog";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: GoodStatus[] = [
  "EXPIRED",
  "EXPIRING_SOON",
  "IN_USE",
  "EXHAUSTED",
];

const statusBadgeVariant = (
  status: GoodStatus,
): "destructive" | "default" | "outline" | "secondary" => {
  switch (status) {
    case "EXPIRED":
      return "destructive";
    case "EXPIRING_SOON":
      return "outline";
    case "IN_USE":
      return "default";
    case "EXHAUSTED":
      return "secondary";
  }
};

const GoodsPage = () => {
  const { t } = useTranslation();

  const [pageData, setPageData] = useState<Page<Good>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: PAGE_SIZE,
    number: 0,
    first: true,
    last: true,
    empty: true,
  });
  const [categories, setCategories] = useState<GoodCategory[]>([]);
  const [brands, setBrands] = useState<GoodBrand[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [filterBrandId, setFilterBrandId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<GoodStatus | null>(null);
  const [page, setPage] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingGood, setEditingGood] = useState<Good | null>(null);
  const [deletingGood, setDeletingGood] = useState<Good | null>(null);
  const [expandedGoodId, setExpandedGoodId] = useState<number | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [brandManagerOpen, setBrandManagerOpen] = useState(false);

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
        search: search || undefined,
        categoryId: filterCategoryId ?? undefined,
        brandId: filterBrandId ?? undefined,
        status: filterStatus ?? undefined,
        page,
        size: PAGE_SIZE,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      setPageData(data);
    } finally {
      setLoading(false);
    }
  }, [search, filterCategoryId, filterBrandId, filterStatus, page]);

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
    setFilterStatus(null);
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
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("goods.filters.allStatuses")}>
                {() =>
                  filterStatus == null
                    ? t("goods.filters.allStatuses")
                    : t(`goods.status.${filterStatus}`)
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
                <>
                  <TableRow key={good.id}>
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
                        <img
                          src={good.firstPictureUrl}
                          alt=""
                          className="size-8 rounded object-cover ring-1 ring-foreground/10"
                        />
                      ) : (
                        <div className="size-8 rounded bg-muted" />
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
                      <Badge variant={statusBadgeVariant(good.status)}>
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
                      key={`expanded-${good.id}`}
                      good={good}
                      colSpan={9}
                      onGoodUpdated={fetchGoods}
                    />
                  )}
                </>
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

      <CreateGoodDialog
        open={createOpen}
        categories={categories}
        brands={brands}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchGoods}
        onNavigateToGood={handleNavigateToGood}
      />
      <EditGoodDialog
        open={!!editingGood}
        good={editingGood}
        categories={categories}
        brands={brands}
        onClose={() => setEditingGood(null)}
        onSuccess={fetchGoods}
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
    </div>
  );
};

export default GoodsPage;
