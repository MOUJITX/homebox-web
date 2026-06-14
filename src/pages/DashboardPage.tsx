import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  PackageIcon,
  BoxIcon,
  BanknoteIcon,
  ReceiptIcon,
  CreditCardIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  LoaderIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboard } from "@/hooks/queries/useDashboard";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const getDaysLeft = (dateStr: string) => {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useDashboard();
  const [itemTab, setItemTab] = useState<"expiringSoon" | "inUse">(
    "expiringSoon",
  );
  const [assetTab, setAssetTab] = useState<"warrantyExpiring" | "inUse">(
    "warrantyExpiring",
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const {
    stats,
    expiringSoonItems,
    inUseItems,
    warrantyExpiringAssets,
    inUseAssets,
    upcomingRenewals,
    expiringDocuments,
  } = data;

  const statCards = [
    {
      icon: PackageIcon,
      label: t("dashboard.stats.itemCount"),
      value: stats.itemCount,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: BoxIcon,
      label: t("dashboard.stats.assetCount"),
      value: stats.assetCount,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: BanknoteIcon,
      label: t("dashboard.stats.totalAssetPrice"),
      value: formatCurrency(stats.totalAssetPrice),
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: ReceiptIcon,
      label: t("dashboard.stats.invoiceCount"),
      value: stats.invoiceCount,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: CreditCardIcon,
      label: t("dashboard.activeSubscriptions"),
      value: stats.activeSubscriptionCount,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      icon: BanknoteIcon,
      label: t("dashboard.monthlySpending"),
      value:
        stats.monthlySubscriptionSpending != null
          ? formatCurrency(stats.monthlySubscriptionSpending)
          : "—",
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/10",
    },
    {
      icon: ShieldCheckIcon,
      label: t("dashboard.activeDocuments"),
      value: stats.activeDocumentCount ?? 0,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-500/10",
      link: "/archives",
    },
  ];

  const tabClass = (active: boolean) =>
    cn(
      "rounded-md px-3 py-1 text-sm font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted",
    );

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 px-4">
              <div className={cn("rounded-lg p-2.5", stat.bg)}>
                <stat.icon className={cn("size-5", stat.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-0.5 truncate text-lg font-semibold">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Items Card */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t("dashboard.items.title")}</CardTitle>
          <div className="flex gap-1">
            <button
              className={tabClass(itemTab === "expiringSoon")}
              onClick={() => setItemTab("expiringSoon")}
            >
              <AlertTriangleIcon className="mr-1 inline size-3.5" />
              {t("dashboard.items.expiringSoon")}
            </button>
            <button
              className={tabClass(itemTab === "inUse")}
              onClick={() => setItemTab("inUse")}
            >
              <ClockIcon className="mr-1 inline size-3.5" />
              {t("dashboard.items.inUse")}
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {itemTab === "expiringSoon" ? (
            expiringSoonItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t("dashboard.items.columns.productName")}
                    </TableHead>
                    <TableHead>
                      {t("dashboard.items.columns.category")}
                    </TableHead>
                    <TableHead>{t("dashboard.items.columns.brand")}</TableHead>
                    <TableHead>
                      {t("dashboard.items.columns.expirationDate")}
                    </TableHead>
                    <TableHead>
                      {t("dashboard.items.columns.daysLeft")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringSoonItems.map((item) => {
                    const daysLeft = getDaysLeft(item.expirationDate);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell>{item.brandName}</TableCell>
                        <TableCell>{formatDate(item.expirationDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={daysLeft <= 7 ? "destructive" : "warning"}
                          >
                            {daysLeft}d
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.items.empty")}
              </p>
            )
          ) : inUseItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("dashboard.items.columns.productName")}
                  </TableHead>
                  <TableHead>{t("dashboard.items.columns.category")}</TableHead>
                  <TableHead>{t("dashboard.items.columns.brand")}</TableHead>
                  <TableHead>
                    {t("dashboard.items.columns.expirationDate")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inUseItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell>{item.brandName}</TableCell>
                    <TableCell>{formatDate(item.expirationDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("dashboard.items.empty")}
            </p>
          )}
        </CardContent>
        <div className="border-t px-4 py-2">
          <Link
            to="/expiration"
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t("dashboard.items.viewMore")}
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </Card>

      {/* Assets Card */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t("dashboard.assets.title")}</CardTitle>
          <div className="flex gap-1">
            <button
              className={tabClass(assetTab === "warrantyExpiring")}
              onClick={() => setAssetTab("warrantyExpiring")}
            >
              <ShieldCheckIcon className="mr-1 inline size-3.5" />
              {t("dashboard.assets.warrantyExpiring")}
            </button>
            <button
              className={tabClass(assetTab === "inUse")}
              onClick={() => setAssetTab("inUse")}
            >
              <ClockIcon className="mr-1 inline size-3.5" />
              {t("dashboard.assets.inUse")}
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {assetTab === "warrantyExpiring" ? (
            warrantyExpiringAssets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("dashboard.assets.columns.name")}</TableHead>
                    <TableHead>
                      {t("dashboard.assets.columns.category")}
                    </TableHead>
                    <TableHead>{t("dashboard.assets.columns.place")}</TableHead>
                    <TableHead>{t("dashboard.assets.columns.price")}</TableHead>
                    <TableHead>
                      {t("dashboard.assets.columns.expirationDate")}
                    </TableHead>
                    <TableHead>
                      {t("dashboard.assets.columns.daysLeft")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warrantyExpiringAssets.map((asset) => {
                    const daysLeft = getDaysLeft(asset.expirationDate);
                    return (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">
                          {asset.name}
                        </TableCell>
                        <TableCell>{asset.categoryName}</TableCell>
                        <TableCell>{asset.placeName}</TableCell>
                        <TableCell>
                          {asset.price != null
                            ? formatCurrency(asset.price)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {formatDate(asset.expirationDate)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={daysLeft <= 30 ? "destructive" : "warning"}
                          >
                            {daysLeft}d
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.assets.empty")}
              </p>
            )
          ) : inUseAssets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.assets.columns.name")}</TableHead>
                  <TableHead>
                    {t("dashboard.assets.columns.category")}
                  </TableHead>
                  <TableHead>{t("dashboard.assets.columns.place")}</TableHead>
                  <TableHead>{t("dashboard.assets.columns.price")}</TableHead>
                  <TableHead>
                    {t("dashboard.assets.columns.shopDate")}
                  </TableHead>
                  <TableHead>
                    {t("dashboard.assets.columns.warranty")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inUseAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.categoryName}</TableCell>
                    <TableCell>{asset.placeName}</TableCell>
                    <TableCell>
                      {asset.price != null ? formatCurrency(asset.price) : "—"}
                    </TableCell>
                    <TableCell>
                      {asset.shopDate ? formatDate(asset.shopDate) : "—"}
                    </TableCell>
                    <TableCell>
                      {asset.hasWarranty ? (
                        <Badge
                          variant={
                            asset.warrantyStatus === "IN_WARRANTY"
                              ? "success"
                              : asset.warrantyStatus === "OUT_WARRANTY"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {t(`assets.warranty.${asset.warrantyStatus}`)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {t("assets.warranty.NO_WARRANTY")}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("dashboard.assets.empty")}
            </p>
          )}
        </CardContent>
        <div className="border-t px-4 py-2">
          <Link
            to="/assets"
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t("dashboard.assets.viewMore")}
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </Card>

      {upcomingRenewals && upcomingRenewals.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("dashboard.upcomingRenewals")}</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("subscriptions.table.name")}</TableHead>
                  <TableHead>{t("subscriptions.table.platform")}</TableHead>
                  <TableHead>{t("subscriptions.table.endDate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingRenewals.map((renewal) => {
                  const daysLeft = getDaysLeft(renewal.endDate);
                  return (
                    <TableRow key={renewal.id}>
                      <TableCell className="font-medium">
                        {renewal.name}
                      </TableCell>
                      <TableCell>{renewal.platformName}</TableCell>
                      <TableCell>
                        <span>{formatDate(renewal.endDate)}</span>
                        <Badge
                          variant={daysLeft <= 3 ? "destructive" : "warning"}
                          className="ml-2"
                        >
                          {daysLeft}d
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
          <div className="border-t px-4 py-2">
            <Link
              to="/subscriptions"
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t("dashboard.upcomingRenewals")}
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </Card>
      )}

      {expiringDocuments && expiringDocuments.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("dashboard.upcomingDocumentExpiries")}</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("archives.table.name")}</TableHead>
                  <TableHead>{t("archives.table.category")}</TableHead>
                  <TableHead>{t("archives.table.expiryDate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringDocuments.map((doc) => {
                  const daysLeft = getDaysLeft(doc.expiryDate);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.name}
                      </TableCell>
                      <TableCell>{doc.categoryName}</TableCell>
                      <TableCell>
                        <span>{formatDate(doc.expiryDate)}</span>
                        <Badge
                          variant={daysLeft <= 3 ? "destructive" : "warning"}
                          className="ml-2"
                        >
                          {daysLeft}d
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
          <div className="border-t px-4 py-2">
            <Link
              to="/archives"
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t("dashboard.upcomingDocumentExpiries")}
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
