import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ImageIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "lucide-react";
import type { Good, GoodItem, ItemStatus } from "@/api/goods";
import { getGoodItems, updateGoodItem } from "@/api/goodItems";
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
import CreateItemDialog from "./CreateItemDialog";
import EditItemDialog from "./EditItemDialog";
import DeleteItemDialog from "./DeleteItemDialog";
import PictureManager from "./PictureManager";

interface GoodExpandedRowProps {
  readonly good: Good;
  readonly colSpan: number;
  readonly onGoodUpdated: () => void;
  readonly itemStatus?: ItemStatus | null;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const isExpired = (item: GoodItem) =>
  new Date(item.expirationDate) < new Date();

const isExpiringSoon = (item: GoodItem, expiringSoonDays: number) => {
  const now = new Date();
  const expDate = new Date(item.expirationDate);
  const diffDays = Math.ceil(
    (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays > 0 && diffDays <= expiringSoonDays;
};

const GoodExpandedRow = ({
  good,
  colSpan,
  onGoodUpdated,
  itemStatus,
}: GoodExpandedRowProps) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<GoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GoodItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<GoodItem | null>(null);
  const [showPictures, setShowPictures] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getGoodItems(good.id, itemStatus ?? undefined);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [good.id, itemStatus]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleItemChanged = () => {
    void fetchItems();
    onGoodUpdated();
  };

  const handleToggleInUse = async (item: GoodItem) => {
    await updateGoodItem(good.id, item.id, { inUse: !item.inUse });
    handleItemChanged();
  };

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="bg-muted/30 p-4">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{t("goods.items.title")}</h4>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPictures(!showPictures)}
              >
                <ImageIcon className="size-3.5" />
                {t("goods.pictures.manage")}
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <PlusIcon className="size-3.5" />
                {t("goods.items.add")}
              </Button>
            </div>
          </div>

          {showPictures && <PictureManager goodId={good.id} />}

          <div className="rounded-lg ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("goods.items.columns.productDate")}</TableHead>
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
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-16 text-center">
                      {t("common.loading")}
                    </TableCell>
                  </TableRow>
                )}
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-16 text-center text-muted-foreground"
                    >
                      {t("goods.items.empty")}
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.productDate)}</TableCell>
                      <TableCell>{formatDate(item.expirationDate)}</TableCell>
                      <TableCell>{item.lifeDays}</TableCell>
                      <TableCell>
                        {!item.inUse ? (
                          <Badge variant="secondary">
                            {t("goods.status.EXHAUSTED")}
                          </Badge>
                        ) : isExpired(item) ? (
                          <Badge variant="destructive">
                            {t("goods.status.EXPIRED")}
                          </Badge>
                        ) : isExpiringSoon(item, good.expiringSoonDays) ? (
                          <Badge variant="warning">
                            {t("goods.status.EXPIRING_SOON")}
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            {t("goods.status.IN_USE")}
                          </Badge>
                        )}
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
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <CreateItemDialog
          open={createOpen}
          goodId={good.id}
          goodName={good.productName}
          onClose={() => setCreateOpen(false)}
          onSuccess={handleItemChanged}
        />
        <EditItemDialog
          open={!!editingItem}
          goodId={good.id}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={handleItemChanged}
        />
        <DeleteItemDialog
          open={!!deletingItem}
          goodId={good.id}
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onSuccess={handleItemChanged}
        />
      </TableCell>
    </TableRow>
  );
};

export default GoodExpandedRow;
