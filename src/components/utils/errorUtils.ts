import { ConvexError } from "convex/values";
import toast from "react-hot-toast";

export function toastError(error: unknown, defaultMessage: string) {
  console.error(error);

  let errorMessage = defaultMessage;

  if (error instanceof ConvexError) {
    // ConvexError stocke le message dans .data
    errorMessage =
      typeof error.data === "string" ? error.data : JSON.stringify(error.data);
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  toast.error(errorMessage);
}
