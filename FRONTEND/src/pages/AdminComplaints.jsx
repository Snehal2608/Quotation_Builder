import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, CheckCircle, RefreshCw, BellRing, History } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminQuotationNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:5000/api/messages/admin/quotations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 🔒 HARD SAFETY FILTER
      const safeData = (res.data || []).filter(
        (n) => n.type === "quotation" && n.quotation
      );

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
      await axios.put(
        `http://localhost:5000/api/messages/admin/quotations/read/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Local state update for immediate feedback
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, status: 'read' } : n)
      );
    } catch (err) {
      console.error("Mark read failed", err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="min-h-screen px-4 py-8 bg-teal-50 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* TOP NAVIGATION & ACTIONS */}
        <div className="flex flex-col items-start justify-between gap-4 mb-8 md:flex-row md:items-center">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 px-5 py-2.5 text-teal-900 transition bg-white border border-teal-200 shadow-sm rounded-2xl hover:bg-teal-100"
          >
            <ArrowLeft size={20} />
            <span className="font-bold">Admin Panel</span>
          </button>

          <button 
            onClick={loadNotifications}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-teal-600 transition-all hover:text-teal-800 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh Data
          </button>
        </div>

        <div className="p-6 bg-white shadow-2xl border border-teal-100 rounded-[2.5rem] md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-teal-500 rounded-2xl">
              <BellRing size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-teal-900">
              Quotation Alerts
            </h1>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <History size={48} className="mb-4 text-teal-200" />
              <p className="text-xl font-medium text-teal-400">
                All caught up! No new notifications.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden border shadow-sm border-teal-50 rounded-3xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-teal-500 text-white uppercase text-[11px] tracking-widest">
                      <th className="p-5 font-bold text-left">Client Details</th>
                      <th className="p-5 font-bold text-left">Item Description</th>
                      <th className="p-5 font-bold text-center">Dimensions (L×H)</th>
                      <th className="p-5 font-bold text-right">Unit Rate</th>
                      <th className="p-5 font-bold text-right">Grand Total</th>
                      <th className="p-5 font-bold text-center">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-teal-50">
                    {notifications.map((n) => {
                      const isUnread = n.status === "unread";
                      return (
                        <tr
                          key={n._id}
                          className={`
                            transition-colors group
                            ${isUnread ? "bg-teal-50/30" : "bg-white"}
                            hover:bg-teal-50
                          `}
                        >
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              {isUnread && <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />}
                              <div>
                                <p className="font-bold text-teal-900">{n.userId?.name || "Customer"}</p>
                                <p className="text-xs text-teal-500">{n.userId?.email || "No email provided"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5 font-medium text-gray-700">
                            {n.quotation.itemName}
                          </td>
                          <td className="p-5 text-center">
                            <span className="px-3 py-1 font-mono text-gray-600 bg-gray-100 rounded-lg">
                              {n.quotation.length} × {n.quotation.height}
                            </span>
                          </td>
                          <td className="p-5 font-semibold text-right text-gray-600">
                            ₹{n.quotation.rate}
                          </td>
                          <td className="p-5 text-right">
                            <span className="text-lg font-black text-teal-600">
                              ₹{n.quotation.totalPrice}
                            </span>
                          </td>
                          <td className="p-5 text-center">
                            {isUnread ? (
                              <button
                                onClick={() => markAsRead(n._id)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black text-white transition-all bg-teal-500 shadow-lg rounded-xl shadow-teal-200 hover:bg-teal-600 active:scale-95"
                              >
                                <CheckCircle size={14} />
                                MARK AS READ
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black text-gray-400 border border-gray-100 rounded-lg bg-gray-50">
                                COMPLETED
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pulse {
          animation: pulse 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AdminQuotationNotifications;