import { ConvexError } from "convex/values";

export function getErrorMessage(error: Error | null | undefined): string {
  if (!error) return "Une erreur inattendue s'est produite";

  if (error instanceof ConvexError) {
    return error.data as string;
  }

  return "Une erreur inattendue s'est produite";
}
