import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

const icons = {
  success: <CheckCircle className="w-4 h-4 text-green-400" />,
  error: <AlertCircle className="w-4 h-4 text-red-400" />,
  info: <Info className="w-4 h-4 text-blue-400" />,
};

const borders = {
  success: "border-green-500/30",
  error: "border-red-500/30",
  info: "border-blue-500/30",
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-36 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`border ${borders[toast.type]} rounded-xl px-4 py-3 flex items-center gap-3 pointer-events-auto max-w-sm shadow-xl backdrop-blur-md`}
            style={{ background: "var(--bg-panel)" }}
          >
            {icons[toast.type]}
            <span className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="hover:text-zinc-300 transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
