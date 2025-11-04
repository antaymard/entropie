import { createPortal } from "react-dom";
import { HiMiniXMark } from "react-icons/hi2";

export default function Modal({
  isModalOpen,
  close,
  clickOutsideToClose = true,
  modalTitle = "Modal Title",
  children,
  footer,
  modalStyle,
}: {
  isModalOpen: boolean;
  close?: () => void;
  clickOutsideToClose?: boolean;
  modalTitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  modalStyle?: React.CSSProperties;
}) {
  if (!isModalOpen) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-8"
      onClick={() => clickOutsideToClose && close?.()}
    >
      <div
        className="bg-white rounded border border-gray-300 flex flex-col min-w-96 "
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h4 className="text-lg font-semibold">{modalTitle}</h4>
          {close && (
            <button
              type="button"
              onClick={() => close?.()}
              className="rounded-md aspect-square p-1 bg-gray-100 hover:bg-gray-200"
            >
              <HiMiniXMark size={24} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-5 pt-2 h-full">{children}</div>

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
