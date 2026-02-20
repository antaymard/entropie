import {
  format as dateFnsFormat,
  formatDistanceToNow as dateFnsFormatDistanceToNow,
} from "date-fns";
import { enUS } from "date-fns/locale";

/**
 * Format a date with the English locale
 * @param date The date to format
 * @param formatStr The output format (e.g. "EEE dd MMM yyyy")
 */
export const format = (date: Date, formatStr: string) =>
  dateFnsFormat(date, formatStr, { locale: enUS });

/**
 * Format the distance between a date and now with the English locale
 * @param date The date to compare
 * @param options Additional options (e.g. { addSuffix: true })
 */
export const formatDistanceToNow = (
  date: Date,
  options?: Parameters<typeof dateFnsFormatDistanceToNow>[1]
) => dateFnsFormatDistanceToNow(date, { ...options, locale: enUS });
