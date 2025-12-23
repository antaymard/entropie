import {
  format as dateFnsFormat,
  formatDistanceToNow as dateFnsFormatDistanceToNow,
} from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Format une date avec la locale française
 * @param date La date à formater
 * @param formatStr Le format de sortie (ex: "EEE dd MMM yyyy")
 */
export const format = (date: Date, formatStr: string) =>
  dateFnsFormat(date, formatStr, { locale: fr });

/**
 * Formate la distance entre une date et maintenant avec la locale française
 * @param date La date à comparer
 * @param options Options supplémentaires (ex: { addSuffix: true })
 */
export const formatDistanceToNow = (
  date: Date,
  options?: Parameters<typeof dateFnsFormatDistanceToNow>[1]
) => dateFnsFormatDistanceToNow(date, { ...options, locale: fr });
