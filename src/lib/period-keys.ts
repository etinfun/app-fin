import {
  format,
  getISOWeek,
  getQuarter,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  parseISO,
  isWithinInterval,
} from "date-fns";
import type { PeriodType, ReportPeriodType } from "@/types/database";

export function getPeriodKey(
  date: Date | string,
  periodType: PeriodType | Exclude<ReportPeriodType, "day">
): string {
  const d = typeof date === "string" ? parseISO(date) : date;

  switch (periodType) {
    case "week":
      return `${format(d, "yyyy")}-W${String(getISOWeek(d)).padStart(2, "0")}`;
    case "month":
      return format(d, "yyyy-MM");
    case "quarter":
      return `${format(d, "yyyy")}-Q${getQuarter(d)}`;
  }
}

export function getDayKey(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

export function isDateInPeriod(
  date: Date | string,
  periodType: ReportPeriodType,
  periodKey: string
): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;

  if (periodType === "day") {
    return getDayKey(d) === periodKey;
  }

  if (periodType === "week") {
    const match = periodKey.match(/^(\d{4})-W(\d{2})$/);
    if (!match) return false;
    const year = Number(match[1]);
    const week = Number(match[2]);
    const jan4 = new Date(year, 0, 4);
    const weekStart = startOfWeek(jan4, { weekStartsOn: 1 });
    weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  }

  if (periodType === "month") {
    return getPeriodKey(d, "month") === periodKey;
  }

  if (periodType === "quarter") {
    return getPeriodKey(d, "quarter") === periodKey;
  }

  return false;
}

export function getPeriodLabel(
  periodType: PeriodType | ReportPeriodType,
  periodKey: string
): string {
  if (periodType === "day") {
    return format(parseISO(periodKey), "MMM d, yyyy");
  }
  if (periodType === "week") {
    return `Week ${periodKey.split("-W")[1]}, ${periodKey.split("-W")[0]}`;
  }
  if (periodType === "month") {
    const [year, month] = periodKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return format(date, "MMMM yyyy");
  }
  if (periodType === "quarter") {
    return periodKey.replace("-", " ");
  }
  return periodKey;
}

export function getCurrentPeriodKey(
  periodType: PeriodType | ReportPeriodType
): string {
  const now = new Date();
  if (periodType === "day") return getDayKey(now);
  return getPeriodKey(now, periodType);
}

export function shiftPeriodKey(
  periodType: PeriodType | ReportPeriodType,
  periodKey: string,
  delta: number
): string {
  if (periodType === "day") {
    const d = parseISO(periodKey);
    d.setDate(d.getDate() + delta);
    return getDayKey(d);
  }

  if (periodType === "week") {
    const match = periodKey.match(/^(\d{4})-W(\d{2})$/);
    if (!match) return periodKey;
    const year = Number(match[1]);
    const week = Number(match[2]);
    const jan4 = new Date(year, 0, 4);
    const weekStart = startOfWeek(jan4, { weekStartsOn: 1 });
    weekStart.setDate(weekStart.getDate() + (week - 1 + delta) * 7);
    return getPeriodKey(weekStart, "week");
  }

  if (periodType === "month") {
    const [year, month] = periodKey.split("-").map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    return getPeriodKey(d, "month");
  }

  if (periodType === "quarter") {
    const match = periodKey.match(/^(\d{4})-Q(\d)$/);
    if (!match) return periodKey;
    const year = Number(match[1]);
    const quarter = Number(match[2]);
    const month = (quarter - 1) * 3 + delta * 3;
    const d = new Date(year, month, 1);
    return getPeriodKey(d, "quarter");
  }

  return periodKey;
}

export function getPeriodBounds(
  periodType: ReportPeriodType,
  periodKey: string
): { start: Date; end: Date } {
  if (periodType === "day") {
    const d = parseISO(periodKey);
    return { start: d, end: d };
  }

  if (periodType === "week") {
    const match = periodKey.match(/^(\d{4})-W(\d{2})$/);
    if (!match) throw new Error("Invalid week key");
    const year = Number(match[1]);
    const week = Number(match[2]);
    const jan4 = new Date(year, 0, 4);
    const weekStart = startOfWeek(jan4, { weekStartsOn: 1 });
    weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
    return {
      start: weekStart,
      end: endOfWeek(weekStart, { weekStartsOn: 1 }),
    };
  }

  if (periodType === "month") {
    const [year, month] = periodKey.split("-").map(Number);
    const start = startOfMonth(new Date(year, month - 1, 1));
    return { start, end: endOfMonth(start) };
  }

  const match = periodKey.match(/^(\d{4})-Q(\d)$/);
  if (!match) throw new Error("Invalid quarter key");
  const year = Number(match[1]);
  const quarter = Number(match[2]);
  const start = startOfQuarter(new Date(year, (quarter - 1) * 3, 1));
  return { start, end: endOfQuarter(start) };
}
