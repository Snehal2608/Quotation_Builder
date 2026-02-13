import React, { useState, useEffect } from "react";
import { Trash2, X, CheckCircle, Edit3, Image as ImageIcon } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useRates } from "../context/RateContext";
import { fileToBase64 } from "../utils/fileToBase64";

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
      navigate("/generate-quotation");
      return;
    }
    fetchRates();
  }, [fetchRates, navigate]);

  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 4000);
  };

  const handleAddOrUpdate = async () => {
    if (!itemName.trim() || !rate) {
      setError("Item name and rate are required.");
      clearMessages();
      return;
    }

    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue <= 0) {
      setError("Rate must be a positive number.");
      clearMessages();
      return;
    }

    // ✅ THE CONSOLE GUARD: Prevents Axios from ever running if image is too large
    // 7MB is the safe limit because Base64 expands the size by ~33%
    if (image && image.size > 7 * 1024 * 1024) {
      setError("Image exceeds the 7MB limit. Please upload a smaller file.");
      clearMessages();
      return; 
    }

    try {
      const token = localStorage.getItem("token");
      let imageBase64 = null;
      
      if (image) {
        imageBase64 = await fileToBase64(image);
      }

      await axios.post("http://localhost:5000/api/rates", {
        itemName,
        rate: rateValue,
        description: description || "",
        imageBase64,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("Rate saved successfully.");
      await fetchRates();

      // Reset form
      setItemName("");
      setRate("");
      setDescription("");
      setImage(null);
    } catch (err) {
      // Catch genuine server errors
      if (err.response?.status === 413) {
        setError("The server rejected the file. Please use a much smaller image.");
      } else {
        setError("Error saving rate.");
      }
      clearMessages();
    }
  };

  const handleDelete = async (id, name) => {
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
      await axios.put(`http://localhost:5000/api/rates/${id}`, {
        itemName: currentItem.itemName,
        rate: rateValue,
        description: currentItem.description,
      }, { headers: { Authorization: `Bearer ${token}` } });

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
    <div className="flex items-start justify-center min-h-screen py-8 bg-gray-100">
      <div className="w-full max-w-6xl p-6 bg-white shadow-xl rounded-[2.5rem] md:p-10">
        {(error || success) && (
          <div className={`mb-6 p-4 rounded-xl font-bold text-center ${error ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
            {error || success}
          </div>
        )}

        <h1 className="mb-8 text-4xl font-extrabold text-teal-900">Rate Management</h1>

        <div className="p-8 mb-10 border border-gray-100 shadow-lg bg-gray-50/50 rounded-[2rem]">
          <h2 className="mb-6 text-2xl font-bold text-teal-900">+ Add New Item Rate</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col">
              <label className="block mb-2 text-sm font-bold text-gray-600">Item Name</label>
              <input
                type="text"
                placeholder="Enter item name..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="p-3 border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-800"
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
                className="p-3 border border-gray-200 outline-none rounded-xl focus:ring-2 focus:ring-teal-800"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-bold text-gray-600">Description</label>
            <textarea
              placeholder="Enter item description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full p-3 border border-gray-200 outline-none resize-none rounded-xl focus:ring-2 focus:ring-teal-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6">
            <label className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    // 7MB strict limit to prevent console errors
                    const maxSizeBytes = 7 * 1024 * 1024;
                    if (file.size > maxSizeBytes) {
                      setError("File is too large! Please select an image under 7MB.");
                      setImage(null);
                      e.target.value = null; // Clears the file from the input
                      clearMessages();
                    } else {
                      setError(null);
                      setImage(file);
                    }
                  }
                }}
                className="hidden"
              />
              <span className="inline-flex items-center justify-center px-6 py-3 font-bold text-white transition-all bg-teal-900 shadow-md cursor-pointer rounded-xl hover:bg-teal-800">
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
              className="px-8 py-3 ml-auto font-bold text-white transition-all bg-teal-900 shadow-md rounded-xl hover:bg-teal-800"
            >
              Save Rate
            </button>
          </div>
        </div>

        {/* Display List of Rates */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rates.map((item) => (
            <div key={item._id} className="relative p-6 bg-white border border-gray-100 shadow-md rounded-[1.5rem] hover:shadow-lg transition-shadow overflow-hidden">
              {item.image && (
                <div className="w-full h-32 mb-4 overflow-hidden rounded-xl bg-gray-50">
                  <img src={item.image} alt={item.itemName} className="object-contain w-full h-full" />
                </div>
              )}
              <button onClick={() => handleDelete(item._id, item.itemName)} className="absolute p-1 text-red-500 transition-colors rounded-full shadow-sm top-4 right-4 hover:bg-red-50 bg-white/80">
                <Trash2 size={18} />
              </button>
              <h3 className="pr-6 text-xl font-bold text-teal-900 truncate">{item.itemName}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 min-h-[3.8rem] max-h-[3.8rem] overflow-y-auto pr-[2px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
                {item.description}
              </p>
              {editingItem === item._id ? (
                <div className="flex items-center gap-2 mt-4">
                  <input type="number" value={newRate} onChange={(e) => setNewRate(e.target.value)} className="w-24 p-2 border border-teal-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-800" />
                  <button onClick={() => handleEditSave(item._id, item.itemName)} className="px-3 py-1 font-bold text-white bg-teal-900 rounded-lg hover:bg-teal-800">Save</button>
                  <button onClick={() => setEditingItem(null)} className="px-3 py-1 font-bold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"><X size={16} /></button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-6">
                  <span className="text-xl font-black text-teal-600">₹{item.rate}</span>
                  <button onClick={() => { setEditingItem(item._id); setNewRate(item.rate); }} className="flex items-center px-4 py-2 text-sm font-bold text-white transition-all bg-teal-900 rounded-xl hover:bg-teal-800">
                    <Edit3 size={14} className="mr-2" /> Edit
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