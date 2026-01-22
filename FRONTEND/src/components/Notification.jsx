import { useEffect } from "react";
import { X } from "lucide-react";

const Notification = ({ type = "success", message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  const styles =
    type === "success"
      ? "bg-teal-500 text-white"
      : type === "error"
      ? "bg-red-500 text-white"
      : "bg-gray-800 text-white";

  return (
    <div className="fixed z-50 top-6 right-6 animate-slide-in">
      <div
        className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-xl ${styles}`}
      >
        <span className="text-sm font-semibold">{message}</span>

        <button
          onClick={onClose}
          className="p-1 transition hover:opacity-80"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default Notification;
