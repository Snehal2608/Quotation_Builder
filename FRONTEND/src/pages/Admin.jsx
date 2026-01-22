import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Pencil, Search, Users, Bell, MessageSquare, Plus } from "lucide-react";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null); 
  const [selectedUserItems, setSelectedUserItems] = useState([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [itemsCache, setItemsCache] = useState({});

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchTotalUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTotalUsers(res.data.totalUsers);
    } catch (err) {
      console.error("Error fetching total users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTotalUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = async (userId, email) => {
    setSelectedUserEmail(email);
    setSelectedUserId(userId);

    if (itemsCache[userId]) {
      setSelectedUserItems(itemsCache[userId]);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/user/${userId}/items`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const items = res.data || [];
      setItemsCache((prev) => ({ ...prev, [userId]: items }));
      setSelectedUserItems(items);
    } catch (err) {
      console.error(err);
      setSelectedUserItems([]);
    }
  };

  return (
    <div className="flex items-start justify-center min-h-screen py-10 bg-[#cbf3f0] px-4">
      <div className="w-full max-w-6xl p-6 bg-white shadow-2xl rounded-[2.5rem] md:p-10">
        
        {/* Header Section */}
        <div className="flex flex-col gap-6 mb-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-[#004e64] flex items-center gap-3">
              <Users size={36} className="text-[#06d6a0]" /> Admin Panel
            </h1>
            <p className="mt-1 text-gray-500">Manage users, view items, and handle requests.</p>
          </div>
          <div className="bg-[#e9fffd] px-6 py-3 rounded-2xl border border-teal-100">
            <p className="text-sm font-medium text-[#004e64] uppercase tracking-wider">Total Users</p>
            <p className="text-3xl font-black text-[#06d6a0]">{totalUsers}</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col gap-5 mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/add-user" className="flex items-center gap-2 px-5 py-2.5 text-white bg-[#06d6a0] font-bold rounded-xl shadow-md hover:bg-[#05bc8c] transition-all hover:-translate-y-0.5">
              <Plus size={18} /> Add User
            </Link>
            <Link to="/admin/messages" className="flex items-center gap-2 px-5 py-2.5 text-white bg-[#00b4d8] font-bold rounded-xl shadow-md hover:bg-[#0096b4] transition-all hover:-translate-y-0.5">
              <MessageSquare size={18} /> Messages
            </Link>
            <Link to="/admin/quotations" className="flex items-center gap-2 px-5 py-2.5 text-white bg-[#06d6a0] font-bold rounded-xl shadow-md hover:bg-[#05bc8c] transition-all hover:-translate-y-0.5">
              <Bell size={18} /> Notifications
            </Link>
          </div>

          <div className="relative">
            <Search className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 w-full md:w-80 rounded-xl focus:ring-2 focus:ring-[#06d6a0] outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* User Table */}
        <div className="mb-10 overflow-x-auto bg-white border border-gray-100 shadow-sm rounded-[1.5rem]">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#e9fffd] text-[#004e64] uppercase text-xs">
              <tr>
                <th className="p-5 font-bold">Name</th>
                <th className="p-5 font-bold">Contact</th>
                <th className="p-5 font-bold">Email</th>
                <th className="p-5 font-bold text-center">Role</th>
                <th className="p-5 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => handleUserClick(user._id, user.email)}
                    className={`transition-colors cursor-pointer ${
                      selectedUserId === user._id ? "bg-[#f0fdfa] border-l-4 border-l-[#06d6a0]" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="p-5 font-semibold text-gray-800">{user.name || "N/A"}</td>
                    <td className="p-5 text-gray-600">{user.phoneNo || "N/A"}</td>
                    <td className="p-5 text-gray-600">{user.email}</td>
                    <td className="p-5 text-center">
                      <span className="px-3 py-1 text-[10px] font-black text-teal-700 uppercase rounded-lg bg-teal-100/50">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/edit/${user._id}`);
                          }}
                          className="p-2 text-gray-400 hover:text-[#00b4d8] hover:bg-[#00b4d8]/10 rounded-lg transition-all"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // ✅ Removed window.confirm (Silent Delete)
                            axios.delete(`http://localhost:5000/api/admin/delete-user/${user._id}`, {
                              headers: { Authorization: `Bearer ${token}` }
                            }).then(() => {
                              setUsers(users.filter((u) => u._id !== user._id));
                              // Cleanup state if the deleted user was currently selected
                              if(selectedUserId === user._id) {
                                setSelectedUserItems([]);
                                setSelectedUserId(null);
                              }
                            }).catch(err => console.error("Delete failed", err));
                          }}
                          className="p-2 text-gray-400 transition-all rounded-lg hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-10 italic text-center text-gray-400">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Selected User Items */}
        {selectedUserItems.length > 0 ? (
          <div className="p-8 border-2 border-[#e9fffd] shadow-inner bg-[#f0fdfa]/50 rounded-[2rem] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-teal-100">
              <h2 className="text-2xl font-bold text-[#004e64]">
                Inventory for: <span className="text-[#06d6a0]">{selectedUserEmail}</span>
              </h2>
              <span className="bg-[#06d6a0] text-white px-4 py-1 rounded-full text-xs font-bold">
                {selectedUserItems.length} Items
              </span>
            </div>

            <div className="overflow-hidden bg-white border shadow-sm border-teal-50 rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-[#e9fffd]">
                  <tr>
                    <th className="p-4 text-left font-bold text-[#004e64]">Item Name</th>
                    <th className="p-4 text-right font-bold text-[#004e64]">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedUserItems.map((item, i) => (
                    <tr key={i} className="transition-colors hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-700">{item.itemName}</td>
                      <td className="p-4 text-right font-bold text-[#06d6a0]">₹{item.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : selectedUserId && (
          <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            No items listed for this user.
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;