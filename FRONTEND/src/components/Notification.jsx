import { useEffect } from "react";
import { X } from "lucide-react";

const HEADER_HEIGHT = 96; // must match Header height (px)

const Notification = ({
  type = "success",
  message,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  const styles =
    type === "success"
      ? "bg-teal-900 text-white"
      : type === "error"
      ? "bg-red-500 text-white"
      : "bg-gray-800 text-white";

  return (
    <div
      className="fixed z-50"
      style={{
        top: HEADER_HEIGHT + 24,   // ✅ more space between header & page
        left: "50%",               // ✅ true center
        transform: "translateX(-50%)",
      }}
    >
      <div
        className={`
          flex items-center gap-3
          px-5 py-3            /* ✅ slightly increased height */
          text-sm font-semibold
          rounded-xl
          shadow-lg
          max-w-[420px]
          ${styles}
        `}
      >
        <span className="whitespace-nowrap">{message}</span>

        <button
          onClick={onClose}
          className="opacity-80 hover:opacity-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Notification;
