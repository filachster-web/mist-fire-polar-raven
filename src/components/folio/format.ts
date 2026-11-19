import { format, isValid, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function displayTime(value?: string): string {
  if (!value) return "";
  const parsed = parseISO(value);
  const date = isValid(parsed) ? parsed : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "d MMMM yyyy, HH:mm", { locale: ru });
}
