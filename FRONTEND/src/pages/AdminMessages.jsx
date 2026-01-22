import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import Notification from "../components/Notification"; // Ensure path is correct

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState({ type: "", message: "" });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/messages/admin/messages",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data || []);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async (id) => {
    const reply = replyText[id];
    if (!reply?.trim()) {
      setNotify({ type: "error", message: "Reply cannot be empty" });
      return;
    }

    try {
      // ✅ Instant UI update
      setMessages((prev) =>
        prev.map((m) =>
          m._id === id ? { ...m, reply: reply, status: "read" } : m
        )
      );
      
      await axios.put(
        `http://localhost:5000/api/messages/reply/${id}`,
        { reply },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReplyText({ ...replyText, [id]: "" });
      setNotify({ type: "success", message: "Reply sent successfully!" });
    } catch {
      setNotify({ type: "error", message: "Reply failed" });
      loadMessages();
    }
  };

  const deleteMessage = async (id) => {
    try {
      // ✅ Instant UI update
      setMessages((prev) => prev.filter((m) => m._id !== id));

      await axios.delete(
        `http://localhost:5000/api/messages/delete/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotify({ type: "success", message: "Message deleted successfully!" });
    } catch {
      setNotify({ type: "error", message: "Failed to delete message" });
      loadMessages();
    }
  };

  useEffect(() => {
    loadMessages();
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

        <h1 className="mb-8 text-4xl font-extrabold text-[#004e64]">Admin – User Messages</h1>

        {loading ? (
          <p className="text-center text-[#004e64] font-medium py-10">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-gray-500">No messages found.</p>
        ) : (
          <div className="space-y-6">
            {messages.map((m) => (
              <div key={m._id} className="relative p-6 transition border border-[#e9fffd] shadow-md bg-[#fafffe] rounded-[1.5rem] hover:shadow-lg">
                <div className="absolute flex items-center gap-3 top-6 right-6">
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${m.status === "unread" ? "bg-[#06d6a0] text-white border-[#06d6a0]" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                    {m.status}
                  </span>
                  <button onClick={() => deleteMessage(m._id)} className="p-2 text-gray-400 transition bg-white rounded-lg shadow-sm hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mb-2">
                  <p className="text-sm font-bold text-[#06d6a0]">
                    {m.userId?.name || m.userId?.email} 
                    <span className="ml-2 font-normal text-gray-400">• {new Date(m.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
                <h3 className="text-xl font-bold text-[#004e64]">{m.title}</h3>
                <p className="mt-2 leading-relaxed text-gray-600">{m.message}</p>
                <div className="mt-3 inline-block px-3 py-1 text-[11px] font-bold text-[#004e64] uppercase bg-[#e9fffd] rounded-lg">
                  Category: {m.category}
                </div>
                <div className="mt-6 pt-6 border-t border-[#e9fffd]">
                  {m.reply ? (
                    <div className="p-4 bg-white border border-[#e9fffd] rounded-xl shadow-inner">
                      <p className="text-xs font-bold text-[#06d6a0] uppercase mb-1">Admin Reply:</p>
                      <p className="text-gray-700">{m.reply}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={replyText[m._id] || ""}
                        onChange={(e) => setReplyText({ ...replyText, [m._id]: e.target.value })}
                        className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06d6a0] outline-none transition-all text-sm"
                        placeholder="Type reply..."
                      />
                      <button onClick={() => sendReply(m._id)} className="flex items-center gap-2 px-6 py-3 text-white transition bg-[#06d6a0] font-bold rounded-xl shadow-md hover:bg-[#05bc8c]">
                        <Send size={18} /> Send
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {notify.message && (
        <Notification type={notify.type} message={notify.message} onClose={() => setNotify({ type: "", message: "" })} />
      )}
    </div>
  );
};

export default AdminMessages;