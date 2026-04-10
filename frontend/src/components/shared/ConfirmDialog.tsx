import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = "Delete", onConfirm, onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className="relative rounded-2xl p-6 w-80 shadow-2xl"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border-default)" }}
          >
            <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 transition-colors"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
