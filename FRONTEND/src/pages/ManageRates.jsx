import React, { useState, useEffect } from "react";
import { Trash2, X, CheckCircle, Edit3, Image as ImageIcon } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useRates } from "../context/RateContext";
import { fileToBase64 } from "../utils/fileToBase64";

const MAX_DESCRIPTION_LENGTH = 50;

const ManageRates = () => {
  const { rates, fetchRates } = useRates();

  const [itemName, setItemName] = useState("");
  const [rate, setRate] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [editingItem, setEditingItem] = useState(null);
  const [newRate, setNewRate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      alert("Access denied. Only admins can access this page.");
      navigate("/generate-quotation");
    } else {
      fetchRates();
    }
  }, [navigate, fetchRates]);

  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 4000);
  };

  const handleAddOrUpdate = async () => {
    if (!itemName.trim() || !rate || !description.trim() || !image) {
      setError("All fields (Name, Rate, Description, and Image) are required.");
      clearMessages();
      return;
    }

    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue <= 0) {
      setError("Rate must be a positive number.");
      clearMessages();
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const imageBase64 = await fileToBase64(image);

      await axios.post(
        "http://localhost:5000/api/rates",
        {
          itemName,
          rate: rateValue,
          description,
          imageBase64, 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Rate saved successfully.");
      await fetchRates();
      
      setItemName("");
      setRate("");
      setDescription("");
      setImage(null);
    } catch (err) {
      setError("Error saving rate.");
    }
    clearMessages();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/rates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(`Rate for ${name} deleted successfully.`);
      await fetchRates();
      clearMessages();
    } catch (err) {
      setError("Error deleting item.");
    }
  };

  const handleEditSave = async (id, name) => {
    const rateValue = parseFloat(newRate);
    if (isNaN(rateValue) || rateValue <= 0) {
      setError("Rate must be a valid positive number.");
      clearMessages();
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const currentItem = rates.find((r) => r._id === id);

      await axios.put(
        `http://localhost:5000/api/rates/${id}`,
        {
          itemName: currentItem.itemName,
          rate: rateValue,
          description: currentItem.description,
          // Note: Backend needs to handle cases where imageBase64 isn't sent in PUT
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditingItem(null);
      setNewRate("");
      setSuccess(`Rate for ${name} updated.`);
      await fetchRates();
      clearMessages();
    } catch (err) {
      setError("Error updating rate.");
    }
  };

  return (
    <div className="flex items-start justify-center min-h-screen py-8 bg-[#cbf3f0]">
      <div className="w-full max-w-6xl p-6 bg-white shadow-xl rounded-[2.5rem] md:p-10">
        
        {(error || success) && (
          <div className={`mb-6 p-4 rounded-xl font-bold text-center ${error ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
            {error || success}
          </div>
        )}

        <h1 className="mb-8 text-4xl font-extrabold text-[#004e64]">
          Rate Management
        </h1>

        {/* Input Form Section */}
        <div className="p-8 mb-10 border border-[#e9fffd] shadow-lg bg-[#f0fdfa] rounded-[2rem]">
          <h2 className="mb-6 text-2xl font-bold text-[#004e64]">
            + Add New Item Rate
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col">
              <label className="block mb-2 text-sm font-bold text-gray-600">Item Name</label>
              <input
                type="text"
                placeholder="Enter item name..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06d6a0] outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="block mb-2 text-sm font-bold text-gray-600">Rate (per sq.ft)</label>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06d6a0] outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-600">Description</label>
              <span className={`text-[10px] font-bold ${description.length === MAX_DESCRIPTION_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <textarea
              placeholder="Short detail (max 50 chars)..."
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                  setDescription(e.target.value);
                }
              }}
              rows={2}
              className="w-full p-3 border border-gray-200 resize-none rounded-xl focus:ring-2 focus:ring-[#06d6a0] outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6">
            <label className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="hidden"
              />
              <span className="inline-flex items-center justify-center px-6 py-3 font-bold text-white bg-[#00b4d8] shadow-md cursor-pointer rounded-xl hover:bg-[#0096b4] transition-all">
                <ImageIcon size={18} className="mr-2" />
                Choose Image
              </span>
            </label>
            
            {image && (
              <span className="flex items-center gap-1 px-3 py-1 text-sm font-bold border rounded-lg text-emerald-600 bg-emerald-50 border-emerald-100">
                <CheckCircle size={14} />
                Selected: {image.name.length > 15 ? `${image.name.substring(0, 15)}...` : image.name}
              </span>
            )}

            <button
              onClick={handleAddOrUpdate}
              className="px-8 py-3 font-bold text-white bg-[#06d6a0] shadow-md rounded-xl hover:bg-[#05bc8c] transition-all ml-auto"
            >
              Save Rate
            </button>
          </div>
        </div>

        {/* Rates List Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rates.map((item) => (
            <div
              key={item._id}
              className="relative p-6 bg-white border border-[#e9fffd] shadow-md rounded-[1.5rem] hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Image Preview for the Card */}
              {item.image && (
                <div className="w-full h-32 mb-4 overflow-hidden rounded-xl bg-gray-50">
                   <img 
                    src={item.image} 
                    alt={item.itemName} 
                    className="object-contain w-full h-full"
                  />
                </div>
              )}

              <button
                onClick={() => handleDelete(item._id, item.itemName)}
                className="absolute p-1 text-gray-400 transition-colors rounded-full top-4 right-4 hover:text-red-500 bg-white/80"
              >
                <Trash2 size={18} />
              </button>

              <h3 className="pr-6 text-xl font-bold text-[#004e64] truncate">
                {item.itemName}
              </h3>

              <p className="mt-2 text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
                {item.description}
              </p>

              {editingItem === item._id ? (
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-24 p-2 border border-teal-200 rounded-lg outline-none focus:ring-2 focus:ring-[#06d6a0]"
                  />
                  <button
                    onClick={() => handleEditSave(item._id, item.itemName)}
                    className="px-3 py-1 font-bold text-white bg-[#06d6a0] rounded-lg hover:bg-[#05bc8c]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-3 py-1 font-bold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-6">
                  <span className="text-xl font-black text-[#06d6a0]">
                    ₹{item.rate}
                  </span>
                  <button
                    onClick={() => {
                      setEditingItem(item._id);
                      setNewRate(item.rate);
                    }}
                    className="flex items-center px-4 py-2 font-bold text-white bg-[#00b4d8] rounded-xl hover:bg-[#0096b4] transition-all text-sm"
                  >
                    <Edit3 size={14} className="mr-2" />
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageRates;