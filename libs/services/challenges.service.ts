import { endOfMonth, startOfMonth } from "date-fns";

export const getMonthPeriodForNow = (
  cutoffHour: number
): { start: Date; end: Date } => {
  const date = new Date();
  const start = startOfMonth(date);
  start.setHours(0 + cutoffHour, 0, 0, 0);
  const end = endOfMonth(date);
  end.setHours(0 + cutoffHour, 0, 0, 0);

  return { start, end };
};
