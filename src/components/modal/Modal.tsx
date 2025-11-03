import { createPortal } from "react-dom";

export default function Modal({
  isModalOpen,
  setIsModalOpen,
  clickOutsideToClose = true,
  modalTitle = "Modal Title",
  children,
  footer,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  clickOutsideToClose?: boolean;
  modalTitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!isModalOpen) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center"
      onClick={() => clickOutsideToClose && setIsModalOpen(false)}
    >
      <div
        className="bg-white rounded border border-gray-300 flex flex-col min-w-96 max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4">
          <h4 className="text-lg font-semibold">{modalTitle}</h4>
        </div>

        {/* Body */}
        <div className="px-5 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-between px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,

    document.body
  );
}
