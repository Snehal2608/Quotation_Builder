import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, CheckCircle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Notification from "../components/Notification"; // Ensure path is correct

const AdminQuotationNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState({ type: "", message: "" });
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/messages/admin/quotations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const safeData = (res.data || []).filter((n) => n.type === "quotation" && n.quotation);
      setNotifications(safeData);
    } catch (err) {
      console.error("Failed to load quotation notifications", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      // ✅ Instant UI Update
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, status: "read" } : n)));
      await axios.put(`http://localhost:5000/api/messages/admin/quotations/read/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotify({ type: "success", message: "Marked as read!" });
    } catch (err) {
      setNotify({ type: "error", message: "Failed to update status" });
      loadNotifications();
    }
  };

  const deleteNotification = async (id) => {
    try {
      // ✅ Instant UI Update
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      await axios.delete(`http://localhost:5000/api/messages/admin/quotations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotify({ type: "success", message: "Notification deleted!" });
    } catch (err) {
      setNotify({ type: "error", message: "Delete failed" });
      loadNotifications();
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="flex items-start justify-center min-h-screen py-8 bg-[#cbf3f0]">
      <div className="w-full max-w-6xl p-6 bg-white shadow-xl rounded-[2.5rem] md:p-10">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 px-4 py-2 mb-8 text-[#004e64] transition bg-[#e9fffd] rounded-xl hover:bg-[#d1fcf8] font-bold"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <h1 className="mb-8 text-4xl font-extrabold text-[#004e64]">Quotation Notifications</h1>

        {loading ? (
          <p className="text-center text-[#004e64] font-medium py-10">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="py-10 italic text-center text-gray-500">No quotation notifications found.</p>
        ) : (
          <div className="overflow-hidden border border-[#e9fffd] shadow-sm rounded-[1.5rem]">
            <table className="w-full text-sm">
              <thead className="bg-[#e9fffd]">
                <tr className="text-[#004e64]">
                  <th className="p-5 font-bold tracking-wider text-left uppercase">User</th>
                  <th className="p-5 font-bold tracking-wider text-left uppercase">Quotation Items</th>
                  <th className="p-5 font-bold tracking-wider text-right uppercase">Grand Total</th>
                  <th className="p-5 font-bold tracking-wider text-center uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9fffd]">
                {notifications.map((n) => (
                  <tr key={n._id} className="transition-colors bg-white hover:bg-[#fafffe]">
                    <td className="p-5 font-bold text-[#004e64] align-top">
                      {n.userId?.name || n.userId?.email || "User"}
                    </td>
                    <td className="p-5 align-top">
                      {n.quotation.items?.length > 0 ? (
                        <div className="space-y-2">
                          {n.quotation.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col text-gray-700 bg-[#fafffe] border border-[#e9fffd] p-2 rounded-lg">
                              <span className="font-bold text-[#004e64]">• {item.name || item.itemName}</span> 
                              <span className="text-xs text-gray-500">Size: {item.length} × {item.height} | Rate: ₹{item.rate}</span>
                              <span className="text-xs font-semibold text-[#06d6a0]">Subtotal: ₹{item.total || item.totalPrice}</span>
                            </div>
                          ))}
                        </div>
                      ) : <span className="italic text-gray-400">No items found</span>}
                    </td>
                    <td className="p-5 text-right align-top">
                      <span className="text-xl font-black text-[#06d6a0]">₹{n.quotation.grandTotal}</span>
                    </td>
                    <td className="p-5 align-top">
                      <div className="flex items-center justify-center gap-3">
                        {n.status === "unread" ? (
                          <button onClick={() => markAsRead(n._id)} className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-[#06d6a0] rounded-xl shadow-md hover:bg-[#05bc8c] transition active:scale-95">
                            <CheckCircle size={14} /> MARK READ
                          </button>
                        ) : <span className="px-3 py-1.5 text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-100 rounded-lg uppercase">Read</span>}
                        <button onClick={() => deleteNotification(n._id)} className="p-2 text-red-400 transition rounded-lg bg-red-50 hover:bg-red-500 hover:text-white">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {notify.message && (
        <Notification type={notify.type} message={notify.message} onClose={() => setNotify({ type: "", message: "" })} />
      )}
    </div>
  );
};

export default AdminQuotationNotifications;