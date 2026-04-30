import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface SortIconProps {
  readonly column: string;
  readonly sortKey: string;
  readonly sortDir: "asc" | "desc";
}

const SortIcon = ({ column, sortKey, sortDir }: SortIconProps) => {
  if (sortKey !== column) return <ArrowUpIcon className="size-3 opacity-25" />;
  return sortDir === "asc" ? (
    <ArrowUpIcon className="size-3" />
  ) : (
    <ArrowDownIcon className="size-3" />
  );
};

export default SortIcon;
