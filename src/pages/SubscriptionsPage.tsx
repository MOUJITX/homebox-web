import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from "lucide-react";
import type {
  Subscription,
  SubscriptionType,
  SubscriptionStatus,
  Page,
} from "@/api/subscriptions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useSubscriptions } from "@/hooks/queries/useSubscriptions";
import { usePlatforms } from "@/hooks/queries/usePlatforms";
import AuthImg from "@/components/AuthImg";
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
import { Pagination, PAGE_SIZE_OPTIONS } from "@/components/ui/pagination";
import SubscriptionDialog from "@/components/subscriptions/SubscriptionDialog";
import SubscriptionDetailDrawer from "@/components/subscriptions/SubscriptionDetailDrawer";
import DeleteSubscriptionDialog from "@/components/subscriptions/DeleteSubscriptionDialog";
import PlatformManagerDialog from "@/components/subscriptions/PlatformManagerDialog";

const SUBSCRIPTION_TYPES: SubscriptionType[] = ["PAY_AS_YOU_GO", "PERIODIC"];
const STATUSES: SubscriptionStatus[] = ["ACTIVE", "INACTIVE", "CANCELLED"];

const EMPTY_PAGE: Page<Subscription> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: PAGE_SIZE_OPTIONS[0],
  number: 0,
  first: true,
  last: true,
  empty: true,
};

const statusBadgeVariant = (
  status: SubscriptionStatus,
): "success" | "secondary" | "outline" => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "INACTIVE":
      return "secondary";
    case "CANCELLED":
      return "outline";
  }
};

const SubscriptionsPage = () => {
  const { t } = useTranslation();
  const { data: platforms = [] } = usePlatforms();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterType, setFilterType] = useState<SubscriptionType | null>(null);
  const [filterStatus, setFilterStatus] = useState<SubscriptionStatus | null>(
    null,
  );
  const [filterPlatformId, setFilterPlatformId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const { data: pageData, isLoading } = useSubscriptions({
    search: debouncedSearch,
    type: filterType,
    status: filterStatus,
    platformId: filterPlatformId,
    page,
    size: pageSize,
  });

  const data = pageData ?? EMPTY_PAGE;

  const [createOpen, setCreateOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);
  const [deletingSubscription, setDeletingSubscription] =
    useState<Subscription | null>(null);
  const [drawerSubId, setDrawerSubId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [platformManagerOpen, setPlatformManagerOpen] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const subIdParam = searchParams.get("subscriptionId");
    if (subIdParam) {
      const id = Number(subIdParam);
      if (!Number.isNaN(id)) {
        setDrawerSubId(id);
        setDrawerOpen(true);
        const next = new URLSearchParams(searchParams);
        next.delete("subscriptionId");
        const query = next.toString();
        navigate(query ? `/subscriptions?${query}` : "/subscriptions", {
          replace: true,
        });
      }
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleOpenDrawer = (subId: number) => {
    setDrawerSubId(subId);
    setDrawerOpen(true);
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
            placeholder={t("subscriptions.searchPlaceholder")}
            className="pl-8"
          />
        </div>

        <div className="w-40">
          <Select
            value={filterType}
            onValueChange={(v) => {
              setFilterType(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("subscriptions.filters.allTypes")}>
                {() =>
                  filterType == null
                    ? t("subscriptions.filters.allTypes")
                    : t(
                        `subscriptions.types.${filterType === "PAY_AS_YOU_GO" ? "payAsYouGo" : "periodic"}`,
                      )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("subscriptions.filters.allTypes")}
              </SelectItem>
              {SUBSCRIPTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(
                    `subscriptions.types.${type === "PAY_AS_YOU_GO" ? "payAsYouGo" : "periodic"}`,
                  )}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="w-36">
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("subscriptions.filters.allStatuses")}>
                {() =>
                  filterStatus == null
                    ? t("subscriptions.filters.allStatuses")
                    : t(`subscriptions.status.${filterStatus.toLowerCase()}`)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("subscriptions.filters.allStatuses")}
              </SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`subscriptions.status.${s.toLowerCase()}`)}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={filterPlatformId}
            onValueChange={(v) => {
              setFilterPlatformId(v);
              setPage(0);
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("subscriptions.filters.allPlatforms")}
              >
                {() =>
                  filterPlatformId == null
                    ? t("subscriptions.filters.allPlatforms")
                    : (platforms.find((p) => p.id === filterPlatformId)?.name ??
                      t("subscriptions.filters.allPlatforms"))
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value={null}>
                {t("subscriptions.filters.allPlatforms")}
              </SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="ml-auto flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPlatformManagerOpen(true)}
          >
            {t("platforms.title")}
          </Button>
          <Button
            onClick={() => {
              setEditingSubscription(null);
              setCreateOpen(true);
            }}
          >
            <PlusIcon className="size-4" />
            {t("subscriptions.create")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>{t("subscriptions.table.name")}</TableHead>
              <TableHead>{t("subscriptions.table.platform")}</TableHead>
              <TableHead>{t("subscriptions.table.type")}</TableHead>
              <TableHead>{t("subscriptions.table.status")}</TableHead>
              <TableHead className="text-right">
                {t("subscriptions.table.latestRecord")}
              </TableHead>
              <TableHead className="text-right">
                {t("subscriptions.table.endDate")}
              </TableHead>
              <TableHead className="text-right">
                {t("common.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data.content.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("subscriptions.noSubscriptions")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              data.content.map((sub) => (
                <TableRow
                  key={sub.id}
                  className="cursor-pointer"
                  onClick={() => handleOpenDrawer(sub.id)}
                >
                  <TableCell>
                    {sub.platformLogoUrl ? (
                      <div className="size-8 shrink-0 overflow-hidden rounded ring-1 ring-foreground/10">
                        <AuthImg
                          url={sub.platformLogoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="size-8 shrink-0 rounded bg-muted ring-1 ring-foreground/10" />
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{sub.name}</span>
                  </TableCell>
                  <TableCell>{sub.platformName}</TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {t(
                        `subscriptions.types.${sub.subscriptionType === "PAY_AS_YOU_GO" ? "payAsYouGo" : "periodic"}`,
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(sub.status)}>
                      {t(`subscriptions.status.${sub.status.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {sub.latestRecordAmount != null ? (
                      <span>
                        <span className="text-xs text-muted-foreground">
                          {sub.latestRecordDate
                            ? formatDate(sub.latestRecordDate)
                            : ""}
                        </span>
                        <br />
                        {formatCurrency(sub.latestRecordAmount)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-xs">
                    {sub.latestRecordEndDate &&
                    sub.subscriptionType === "PERIODIC"
                      ? formatDate(sub.latestRecordEndDate)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateOpen(false);
                          setEditingSubscription(sub);
                        }}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateOpen(false);
                          setEditingSubscription(null);
                          setDeletingSubscription(sub);
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

      <SubscriptionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <SubscriptionDialog
        open={!!editingSubscription}
        subscription={editingSubscription}
        onClose={() => setEditingSubscription(null)}
      />
      <DeleteSubscriptionDialog
        open={!!deletingSubscription}
        subscription={deletingSubscription}
        onClose={() => setDeletingSubscription(null)}
      />
      <SubscriptionDetailDrawer
        subscriptionId={drawerSubId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerSubId(null);
        }}
      />
      <PlatformManagerDialog
        open={platformManagerOpen}
        onClose={() => setPlatformManagerOpen(false)}
      />
    </div>
  );
};

export default SubscriptionsPage;
