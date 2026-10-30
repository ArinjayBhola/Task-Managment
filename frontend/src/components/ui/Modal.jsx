/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
export const Modal = ({ isOpen, onClose, title, children }) => {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    if (isOpen) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else dialog.close();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[460px] overflow-y-auto rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
};
