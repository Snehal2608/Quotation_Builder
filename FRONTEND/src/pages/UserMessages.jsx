import React, { useEffect, useState } from "react";
import axios from "axios";

const UserMessages = () => {
  const [messages, setMessages] = useState([]);
  const token = localStorage.getItem("token");

  const loadMessages = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/messages/my-messages",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(res.data || []);
    } catch (err) {
      console.error("Error loading messages", err);
      setMessages([]);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <div className="max-w-3xl p-6 mx-auto">
      <h1 className="mb-4 text-3xl font-bold text-teal-900">
        My Messages
      </h1>

      {messages.length === 0 ? (
        <p className="text-teal-600">No messages yet.</p>
      ) : (
        messages.map((msg) => (
          <div
            key={msg._id}
            className="p-4 mb-4 bg-white border border-teal-100 shadow-md rounded-xl"
          >
            <h3 className="text-lg font-semibold text-teal-900">
              {msg.title}
            </h3>
            <p className="mt-2 text-teal-700">{msg.message}</p>

            <span
              className={`inline-block mt-2 px-3 py-1 text-sm rounded-full ${
                msg.status === "pending"
                  ? "bg-teal-100 text-teal-600"
                  : "bg-teal-100 text-teal-900"
              }`}
            >
              {msg.status.toUpperCase()}
            </span>

            {msg.reply && (
              <div className="p-3 mt-3 bg-teal-100 rounded-lg">
                <p className="font-semibold text-teal-900">
                  Admin Reply:
                </p>
                <p className="text-teal-700">{msg.reply}</p>
              </div>
            )}
          </div>
        ))
      )}

      <button
        onClick={loadMessages}
        className="px-4 py-2 mt-4 text-white bg-teal-500 rounded-lg hover:bg-teal-600"
      >
        Refresh Messages
      </button>
    </div>
  );
};

export default UserMessages;
