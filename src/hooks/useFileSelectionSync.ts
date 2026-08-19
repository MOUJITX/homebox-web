import { useRef } from "react";
import type { FileRecord } from "@/api/files";

export const useFileSelectionSync = (
  currentFileIds: number[],
  onSync: (fileIds: number[]) => Promise<void>,
) => {
  const addedRef = useRef<FileRecord[]>([]);
  const removedRef = useRef<FileRecord[]>([]);
  const scheduledRef = useRef(false);

  const flush = () => {
    scheduledRef.current = false;
    const added = addedRef.current;
    const removed = removedRef.current;
    addedRef.current = [];
    removedRef.current = [];

    if (added.length === 0 && removed.length === 0) return;

    const removedIds = new Set(removed.map((f) => f.id));
    const finalIds = Array.from(
      new Set([
        ...currentFileIds.filter((id) => !removedIds.has(id)),
        ...added.map((f) => f.id),
      ]),
    );

    void onSync(finalIds);
  };

  const handleSelect = (files: FileRecord[]) => {
    addedRef.current = files;
    if (!scheduledRef.current) {
      scheduledRef.current = true;
      queueMicrotask(flush);
    }
  };

  const handleDeselect = (files: FileRecord[]) => {
    removedRef.current = files;
    if (!scheduledRef.current) {
      scheduledRef.current = true;
      queueMicrotask(flush);
    }
  };

  return { handleSelect, handleDeselect };
};
