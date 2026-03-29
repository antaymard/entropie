import {
  cloneElement,
  isValidElement,
  useMemo,
  useRef,
  useState,
  type MouseEventHandler,
  type ReactElement,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/plate/alert-dialog";
import { X } from "lucide-react";

interface ConfirmableButtonProps {
  title: string;
  text: string;
  onCancel?: () => void;
  onConfirm: () => void;
  children: ReactElement<{ onClick?: MouseEventHandler<HTMLElement> }>;
  shouldConfirm?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  showCloseButton?: boolean;
  autoFocusConfirm?: boolean;
}

export default function ConfirmableButton({
  title,
  text,
  onCancel,
  onConfirm,
  children,
  shouldConfirm = true,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  showCloseButton = true,
  autoFocusConfirm = false,
}: ConfirmableButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const childWithDirectConfirm = useMemo(() => {
    if (!isValidElement(children) || shouldConfirm) {
      return children;
    }

    const originalOnClick = children.props.onClick;

    return cloneElement(children, {
      onClick: (event) => {
        originalOnClick?.(event);
        if (event.defaultPrevented) return;
        onConfirm();
      },
    });
  }, [children, onConfirm, shouldConfirm]);

  if (!shouldConfirm) {
    return childWithDirectConfirm;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent
        onOpenAutoFocus={(e) => {
          if (autoFocusConfirm) {
            e.preventDefault();
            confirmRef.current?.focus();
          }
        }}
      >
        {showCloseButton && (
          <AlertDialogCancel
            className="absolute right-3 top-3 h-7 w-7 p-0"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </AlertDialogCancel>
        )}
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{text}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onCancel?.()}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction ref={confirmRef} onClick={() => onConfirm()}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
