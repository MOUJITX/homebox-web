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

const subtractDays = (date: string, days: number): string =>
  addDays(date, -days);

export const useWarrantyDateCalc = (
  initial: {
    activeDate: string;
    expirationDate: string;
    warrantyPeriod: string;
  } = {
    activeDate: "",
    expirationDate: "",
    warrantyPeriod: "",
  },
) => {
  const [activeDate, setActiveDateRaw] = useState(initial.activeDate);
  const [expirationDate, setExpirationDateRaw] = useState(
    initial.expirationDate,
  );
  const [warrantyPeriod, setWarrantyPeriodRaw] = useState(
    initial.warrantyPeriod,
  );

  const setActiveDate = useCallback(
    (v: string) => {
      setActiveDateRaw(v);
      if (v && expirationDate) {
        const d = diffDays(v, expirationDate);
        if (d > 0) setWarrantyPeriodRaw(String(d));
      } else if (v && warrantyPeriod) {
        setExpirationDateRaw(addDays(v, Number.parseInt(warrantyPeriod, 10)));
      }
    },
    [expirationDate, warrantyPeriod],
  );

  const setExpirationDate = useCallback(
    (v: string) => {
      setExpirationDateRaw(v);
      if (v && activeDate) {
        const d = diffDays(activeDate, v);
        if (d > 0) setWarrantyPeriodRaw(String(d));
      } else if (v && warrantyPeriod) {
        setActiveDateRaw(subtractDays(v, Number.parseInt(warrantyPeriod, 10)));
      }
    },
    [activeDate, warrantyPeriod],
  );

  const setWarrantyPeriod = useCallback(
    (v: string) => {
      setWarrantyPeriodRaw(v);
      const days = v ? Number.parseInt(v, 10) : 0;
      if (days > 0 && activeDate) {
        setExpirationDateRaw(addDays(activeDate, days));
      } else if (days > 0 && expirationDate) {
        setActiveDateRaw(subtractDays(expirationDate, days));
      }
    },
    [activeDate, expirationDate],
  );

  const resetDates = useCallback(() => {
    setActiveDateRaw("");
    setExpirationDateRaw("");
    setWarrantyPeriodRaw("");
  }, []);

  const initDates = useCallback((ad: string, ed: string, wp: number) => {
    setActiveDateRaw(ad);
    setExpirationDateRaw(ed);
    setWarrantyPeriodRaw(String(wp));
  }, []);

  return {
    activeDate,
    expirationDate,
    warrantyPeriod,
    setActiveDate,
    setExpirationDate,
    setWarrantyPeriod,
    resetDates,
    initDates,
  };
};
