import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

const toastIcons = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const toastStyles = {
  success: "bg-green-50 border-green-200 text-green-900",
  error: "bg-red-50 border-red-200 text-red-900",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
};

const iconColors = {
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
};

let toastId = 0;
const toasts: Toast[] = [];
const listeners: Array<(toasts: Toast[]) => void> = [];

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setToastList(newToasts);
    };

    listeners.push(listener);

    return () => {
      listeners.splice(listeners.indexOf(listener), 1);
    };
  }, []);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = String(toastId++);
    const newToast: Toast = { id, message, type };

    toasts.push(newToast);
    listeners.forEach((listener) => listener([...toasts]));

    setTimeout(() => {
      const index = toasts.findIndex((t) => t.id === id);
      if (index > -1) {
        toasts.splice(index, 1);
        listeners.forEach((listener) => listener([...toasts]));
      }
    }, 4000);
  };

  return { showToast, toasts: toastList };
}

export function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto border rounded-lg p-4 flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-right-4 ${toastStyles[toast.type]}`}
        >
          <div className={iconColors[toast.type]}>{toastIcons[toast.type]}</div>
          <span className="font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
