import { ConvexError } from "convex/values";

export function getErrorMessage(error: Error | null | undefined): string {
  if (!error) return "An unexpected error occurred";

  if (error instanceof ConvexError) {
    return error.data as string;
  }

  return "An unexpected error occurred";
}
