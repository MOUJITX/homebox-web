import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { SearchIcon, FileIcon, LoaderIcon } from "lucide-react";
import type { SearchResultItem } from "@/api/search";
import { searchContent } from "@/api/search";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getTags = (sources: SearchResultItem["sources"]) => {
  return sources.filter((s) => s.type !== "FILE");
};

interface SearchDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

const SearchDialog = ({ open, onClose }: SearchDialogProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setTotalElements(0);
      return;
    }
    setSearching(true);
    try {
      const { data } = await searchContent(q.trim());
      setResults(data.content);
      setTotalElements(data.totalElements);
    } catch {
      setResults([]);
      setTotalElements(0);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTotalElements(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) void doSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleNavigate = (item: SearchResultItem) => {
    const assetSource = item.sources.find((s) => s.type === "ASSET");
    const goodSource = item.sources.find((s) => s.type === "GOOD");
    const invoiceSource = item.sources.find((s) => s.type === "INVOICE");
    const subscriptionSource = item.sources.find(
      (s) => s.type === "SUBSCRIPTION",
    );
    const documentSource = item.sources.find((s) => s.type === "DOCUMENT");

    if (assetSource?.sourceId) {
      navigate(`/assets?assetId=${assetSource.sourceId}`);
    } else if (goodSource?.sourceId) {
      navigate(`/expiration?goodId=${goodSource.sourceId}`);
    } else if (invoiceSource?.sourceId) {
      navigate(`/invoices?invoiceId=${invoiceSource.sourceId}`);
    } else if (subscriptionSource?.sourceId) {
      navigate(`/subscriptions?subscriptionId=${subscriptionSource.sourceId}`);
    } else if (documentSource?.sourceId) {
      navigate(`/archives?documentId=${documentSource.sourceId}`);
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("search.placeholder")}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            className="pl-9 pr-3"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {!query.trim() && (
            <div className="flex flex-col items-center gap-3 py-8">
              <SearchIcon className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t("search.empty")}
              </p>
            </div>
          )}

          {searching && (
            <div className="flex items-center justify-center py-8">
              <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!searching && query.trim() && results.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8">
              <SearchIcon className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t("search.noResults", { query: query.trim() })}
              </p>
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="grid gap-3">
              {results.map((item) => {
                const tags = getTags(item.sources);
                return (
                  <button
                    key={item.fileId}
                    type="button"
                    className="text-left rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    onClick={() => handleNavigate(item)}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="flex items-center gap-1.5 min-w-0">
                        {tags.map((source) => (
                          <Badge
                            key={source.type}
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            {t(`search.tags.${source.type.toLowerCase()}`)}
                          </Badge>
                        ))}
                        <span className="text-sm font-medium truncate">
                          {item.originalFilename}
                        </span>
                      </div>
                    </div>

                    {item.matches.slice(0, 5).map((match, idx) => (
                      <div
                        key={idx}
                        className="ml-6 text-xs text-muted-foreground mb-0.5"
                      >
                        {match.page && (
                          <span className="mr-1 text-muted-foreground/70">
                            P.{match.page}
                          </span>
                        )}
                        <span
                          dangerouslySetInnerHTML={{ __html: match.snippet }}
                        />
                      </div>
                    ))}

                    <div className="ml-6 mt-1.5 text-xs text-muted-foreground/60">
                      {formatFileSize(item.fileSize)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {totalElements > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            {t("search.totalResults", { count: totalElements })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
