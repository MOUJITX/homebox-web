import { useState, useCallback } from "react";

const diffDays = (from: string, to: string): number => {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.round(ms / 86_400_000);
};

const addDays = (date: string, days: number): string => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const subtractDays = (date: string, days: number): string => addDays(date, -days);

export const useItemDateCalc = (
  initial: { productDate: string; expirationDate: string; lifeDays: string } = {
    productDate: "",
    expirationDate: "",
    lifeDays: "",
  },
) => {
  const [productDate, setProductDateRaw] = useState(initial.productDate);
  const [expirationDate, setExpirationDateRaw] = useState(initial.expirationDate);
  const [lifeDays, setLifeDaysRaw] = useState(initial.lifeDays);

  const setProductDate = useCallback(
    (v: string) => {
      setProductDateRaw(v);
      if (v && expirationDate) {
        const d = diffDays(v, expirationDate);
        if (d > 0) setLifeDaysRaw(String(d));
      } else if (v && lifeDays) {
        setExpirationDateRaw(addDays(v, Number.parseInt(lifeDays, 10)));
      }
    },
    [expirationDate, lifeDays],
  );

  const setExpirationDate = useCallback(
    (v: string) => {
      setExpirationDateRaw(v);
      if (v && productDate) {
        const d = diffDays(productDate, v);
        if (d > 0) setLifeDaysRaw(String(d));
      } else if (v && lifeDays) {
        setProductDateRaw(subtractDays(v, Number.parseInt(lifeDays, 10)));
      }
    },
    [productDate, lifeDays],
  );

  const setLifeDays = useCallback(
    (v: string) => {
      setLifeDaysRaw(v);
      const days = v ? Number.parseInt(v, 10) : 0;
      if (days > 0 && productDate) {
        setExpirationDateRaw(addDays(productDate, days));
      } else if (days > 0 && expirationDate) {
        setProductDateRaw(subtractDays(expirationDate, days));
      }
    },
    [productDate, expirationDate],
  );

  const resetDates = useCallback(() => {
    setProductDateRaw("");
    setExpirationDateRaw("");
    setLifeDaysRaw("");
  }, []);

  const initDates = useCallback(
    (pd: string, ed: string, ld: number) => {
      setProductDateRaw(pd);
      setExpirationDateRaw(ed);
      setLifeDaysRaw(String(ld));
    },
    [],
  );

  return {
    productDate,
    expirationDate,
    lifeDays,
    setProductDate,
    setExpirationDate,
    setLifeDays,
    resetDates,
    initDates,
  };
};
