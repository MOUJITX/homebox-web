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
import { getMembers, type Member } from "@/api/members";
import { getRoles, type Role } from "@/api/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import CreateMemberDialog from "@/components/members/CreateMemberDialog";
import EditMemberDialog from "@/components/members/EditMemberDialog";
import DeleteMemberDialog from "@/components/members/DeleteMemberDialog";

type SortKey = "username" | "displayName" | "roleName" | "createdAt" | "updatedAt";

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

const MembersPage = () => {
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("username");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, rolesRes] = await Promise.all([
        getMembers(),
        getRoles(),
      ]);
      setMembers(membersRes.data);
      setRoles(rolesRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.username.toLowerCase().includes(q) ||
        (m.displayName ?? "").toLowerCase().includes(q),
    );
  }, [members, search]);

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
            placeholder={t("members.search")}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" />
          {t("members.create")}
        </Button>
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => handleSort("username")}
                >
                  {t("members.columns.username")}
                  {sortIcon("username", sortKey, sortDir)}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => handleSort("displayName")}
                >
                  {t("members.columns.displayName")}
                  {sortIcon("displayName", sortKey, sortDir)}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => handleSort("roleName")}
                >
                  {t("members.columns.role")}
                  {sortIcon("roleName", sortKey, sortDir)}
                </button>
              </TableHead>
              <TableHead>{t("members.columns.status")}</TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => handleSort("createdAt")}
                >
                  {t("members.columns.createdAt")}
                  {sortIcon("createdAt", sortKey, sortDir)}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => handleSort("updatedAt")}
                >
                  {t("members.columns.updatedAt")}
                  {sortIcon("updatedAt", sortKey, sortDir)}
                </button>
              </TableHead>
              <TableHead className="text-right">
                {t("members.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {t("common.noResults")}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              paginated.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.username}
                  </TableCell>
                  <TableCell>{member.displayName || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.roleName === "root" ? "destructive" : "default"
                      }
                    >
                      {member.roleName}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.forceChangePassword && (
                      <Badge variant="outline">
                        {t("members.mustChangePassword")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(member.createdAt)}</TableCell>
                  <TableCell>{formatDate(member.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setEditingMember(member)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeletingMember(member)}
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

      <CreateMemberDialog
        open={createOpen}
        roles={roles}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchData}
      />
      <EditMemberDialog
        open={!!editingMember}
        member={editingMember}
        roles={roles}
        onClose={() => setEditingMember(null)}
        onSuccess={fetchData}
      />
      <DeleteMemberDialog
        open={!!deletingMember}
        member={deletingMember}
        onClose={() => setDeletingMember(null)}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default MembersPage;
