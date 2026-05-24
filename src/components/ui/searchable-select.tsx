import { useState, useRef, useEffect, useCallback } from "react";
import { SearchIcon, ChevronDownIcon, XIcon, LoaderIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

type Option = {
  value: number;
  label: string;
  tag?: string;
};

type SearchableSelectProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  options?: Option[];
  onSearch?: (query: string) => Promise<Option[]>;
  placeholder?: string;
  emptyMessage?: string;
};

const SearchableSelect = ({
  value,
  onChange,
  options = [],
  onSearch,
  placeholder = "Search...",
  emptyMessage = "No results",
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [asyncOptions, setAsyncOptions] = useState<Option[]>([]);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  const isAsync = !!onSearch;

  const selected = isAsync
    ? [...options, ...asyncOptions].find((o) => o.value === value)
    : options.find((o) => o.value === value);

  const filtered = isAsync
    ? asyncOptions
    : search
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;

  useEffect(() => {
    if (!isAsync) return;
    const fetchResults = async () => {
      if (!debouncedSearch) {
        setAsyncOptions([]);
        return;
      }
      setSearching(true);
      try {
        const results = await onSearch(debouncedSearch);
        setAsyncOptions(results);
      } finally {
        setSearching(false);
      }
    };
    fetchResults();
  }, [debouncedSearch, isAsync, onSearch]);

  useEffect(() => {
    if (open) return;
    setSearch("");
    setAsyncOptions([]);
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectOption = useCallback((opt: Option) => {
    onChange(opt.value);
    setSearch("");
    setOpen(false);
  }, [onChange]);

  const clearSelection = useCallback(() => {
    onChange(null);
    setSearch("");
    setOpen(false);
  }, [onChange]);

  const displayOptions = isAsync
    ? (debouncedSearch ? filtered : options)
    : filtered;

  return (
    <div ref={containerRef} className="relative w-full">
      {open ? (
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={selected?.label ?? placeholder}
            className="h-8 pl-7 pr-7 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
              }
              if (e.key === "Enter" && displayOptions.length === 1) {
                e.preventDefault();
                selectOption(displayOptions[0]);
              }
            }}
          />
          {searching ? (
            <LoaderIcon className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDownIcon
              className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 cursor-pointer text-muted-foreground"
              onClick={() => setOpen(false)}
            />
          )}
        </div>
      ) : (
        <button
          type="button"
          className="flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none hover:bg-accent/50"
          onClick={() => setOpen(true)}
        >
          <span className={selected ? "" : "text-muted-foreground"}>
            {selected ? (
              <span className="flex items-center gap-2">
                {selected.label}
                {selected.tag && (
                  <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                    {selected.tag}
                  </span>
                )}
              </span>
            ) : (
              placeholder
            )}
          </span>
          {selected && value != null ? (
            <XIcon
              className="size-3.5 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
            />
          ) : (
            <ChevronDownIcon className="size-4 opacity-50" />
          )}
        </button>
      )}

      {open && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-popover p-1 text-sm shadow-md ring-1 ring-foreground/10">
          {displayOptions.length === 0 ? (
            <div className="px-2 py-2 text-center text-xs text-muted-foreground">
              {searching ? "..." : emptyMessage}
            </div>
          ) : (
            displayOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => selectOption(opt)}
              >
                <span>{opt.label}</span>
                {opt.tag && (
                  <span className="ml-2 shrink-0 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                    {opt.tag}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export { SearchableSelect, type Option };
