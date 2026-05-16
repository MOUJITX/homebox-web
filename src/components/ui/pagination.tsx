import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectPopup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

const getPages = (current: number, total: number) => {
  if (total <= 7) return range(0, total - 1);

  const left = Math.max(1, current - 1);
  const right = Math.min(total - 2, current + 1);

  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [0];

  if (left > 2) pages.push("ellipsis-start");
  else if (left === 2) pages.push(1);

  for (let i = left; i <= right; i++) {
    if (i > 0 && i < total - 1) pages.push(i);
  }

  if (right < total - 3) pages.push("ellipsis-end");
  else if (right === total - 3) pages.push(total - 2);

  if (total > 1) pages.push(total - 1);

  return pages;
};

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const Pagination = ({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) => {
  const pages = getPages(currentPage, totalPages);

  return (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Select
          value={pageSize}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-7 w-auto gap-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={size}>
                {size} / page
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={currentPage <= 0}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeftIcon className="size-3.5" />
        </Button>

        {pages.map((p) =>
          typeof p === "number" ? (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="icon-sm"
              className="size-7 text-xs"
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </Button>
          ) : (
            <span
              key={p}
              className="flex size-7 items-center justify-center text-xs"
            >
              ...
            </span>
          ),
        )}

        <Button
          variant="outline"
          size="icon-sm"
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRightIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
};

export { Pagination, PAGE_SIZE_OPTIONS };
