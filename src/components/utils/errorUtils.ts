import toast from "react-hot-toast";

export function toastError(error: any, defaultMessage: string) {
  console.error(error);
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  toast.error(errorMessage);
}
