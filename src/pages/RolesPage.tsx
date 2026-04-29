import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { getRoles, type Role } from "@/api/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import CreateRoleDialog from "@/components/roles/CreateRoleDialog";
import EditRoleDialog from "@/components/roles/EditRoleDialog";
import DeleteRoleDialog from "@/components/roles/DeleteRoleDialog";

type SortKey = "name" | "description" | "createdAt" | "updatedAt";

const PAGE_SIZE = 10;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const sortIcon = (column: SortKey, sortKey: SortKey, sortDir: "asc" | "desc") => {
  if (sortKey !== column)
    return <ArrowUpIcon className="size-3 opacity-25" />;
  return sortDir === "asc" ? (
    <ArrowUpIcon className="size-3" />
  ) : (
    <ArrowDownIcon className="size-3" />
  );
};

const RolesPage = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getRoles();
      setRoles(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }, [roles, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = (a[sortKey] ?? "") as string;
      const bVal = (b[sortKey] ?? "") as string;
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("roles.search")}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" />
          {t("roles.create")}
        </Button>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => handleSort("name")}
                >
                  {t("roles.columns.name")}
                  {sortIcon("name", sortKey, sortDir)}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => handleSort("description")}
                >
                  {t("roles.columns.description")}
                  {sortIcon("description", sortKey, sortDir)}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => handleSort("createdAt")}
                >
                  {t("roles.columns.createdAt")}
                  {sortIcon("createdAt", sortKey, sortDir)}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => handleSort("updatedAt")}
                >
                  {t("roles.columns.updatedAt")}
                  {sortIcon("updatedAt", sortKey, sortDir)}
                </button>
              </TableHead>
              <TableHead className="text-right">
                {t("roles.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {t("common.noResults")}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              paginated.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description || "—"}</TableCell>
                  <TableCell>{formatDate(role.createdAt)}</TableCell>
                  <TableCell>{formatDate(role.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setEditingRole(role)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeletingRole(role)}
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
              current: safePage,
              total: totalPages,
            })}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <CreateRoleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchData}
      />
      <EditRoleDialog
        open={!!editingRole}
        role={editingRole}
        onClose={() => setEditingRole(null)}
        onSuccess={fetchData}
      />
      <DeleteRoleDialog
        open={!!deletingRole}
        role={deletingRole}
        onClose={() => setDeletingRole(null)}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default RolesPage;
