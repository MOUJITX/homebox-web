import { useEffect, useState } from "react";
import axios from "@/api/axios";

const stripApiPrefix = (url: string) =>
  url.startsWith("/api/") ? url.slice(4) : url;

export const useAuthImage = (url: string | undefined | null) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      return;
    }

    let revoke: string | null = null;
    let cancelled = false;

    axios
      .get(stripApiPrefix(url), { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        const objUrl = URL.createObjectURL(res.data);
        revoke = objUrl;
        setBlobUrl(objUrl);
      })
      .catch(() => {
        if (!cancelled) setBlobUrl(null);
      });

    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [url]);

  return blobUrl;
};

export const downloadAuthFile = async (url: string, filename: string) => {
  const res = await axios.get(stripApiPrefix(url), { responseType: "blob" });
  const objUrl = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objUrl);
};
