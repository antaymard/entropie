import { ConvexError } from "convex/values";
import i18n from "@/i18n";

export function getErrorMessage(error: Error | null | undefined): string {
  if (!error) return i18n.t("errors.unexpectedError");

  if (error instanceof ConvexError) {
    return error.data as string;
  }

  return i18n.t("errors.unexpectedError");
}
