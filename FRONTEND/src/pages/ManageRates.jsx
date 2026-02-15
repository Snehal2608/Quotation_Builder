import React, { useState, useEffect } from "react";
import { Trash2, X, CheckCircle, Edit3, Image as ImageIcon, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useRates } from "../context/RateContext";
import { fileToBase64 } from "../utils/fileToBase64";

const ManageRates = () => {
  const { rates, fetchRates, loading } = useRates();

  // Form State
  const [itemName, setItemName] = useState("");
  const [rate, setRate] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  // UI Feedback State
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing State
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
      setError("Please enter a valid positive rate.");
      clearMessages();
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      let imageBase64 = null;
      
      if (image) {
        // Safe limit for Base64 strings (approx 7MB raw file)
        if (image.size > 7 * 1024 * 1024) {
          setError("Image is too large. Please use a file under 7MB.");
          setIsSubmitting(false);
          clearMessages();
          return;
        }
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

      setSuccess(`Rate for "${itemName}" added successfully.`);
      await fetchRates(); // Critical for browser-to-browser sync

      // Reset Form
      setItemName("");
      setRate("");
      setDescription("");
      setImage(null);
      clearMessages();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving rate.");
      clearMessages();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the rate for ${name}?`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/rates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(`Deleted ${name} successfully.`);
      await fetchRates();
      clearMessages();
    } catch (err) {
      setError("Could not delete item.");
      clearMessages();
    }
  };

  const handleEditSave = async (id, name) => {
    const rateValue = parseFloat(newRate);
    if (isNaN(rateValue) || rateValue <= 0) {
      setError("Invalid rate.");
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
      setSuccess(`Updated ${name} to ₹${rateValue}`);
      await fetchRates();
      clearMessages();
    } catch (err) {
      setError("Update failed.");
    }
  };

  return (
    <div className="flex items-start justify-center min-h-screen py-8 bg-gray-50">
      <div className="w-full max-w-6xl p-6 bg-white shadow-2xl rounded-[2.5rem] md:p-10 border border-gray-100">
        
        {/* Status Notifications */}
        {(error || success) && (
          <div className={`mb-6 p-4 rounded-2xl font-bold text-center animate-in fade-in slide-in-from-top-4 duration-300 ${
            error ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
          }`}>
            {error || success}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-teal-900 tracking-tight">Rate Management</h1>
          {loading && <Loader2 className="animate-spin text-teal-600" size={24} />}
        </div>

        {/* Create Form Section */}
        <div className="p-8 mb-10 border border-gray-100 shadow-xl bg-gray-50/30 rounded-[2rem]">
          <h2 className="mb-6 text-2xl font-bold text-teal-800 flex items-center gap-2">
            <PlusCircle className="text-teal-600" /> Create New Item Rate
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col">
              <label className="block mb-2 text-xs font-black uppercase text-gray-400 tracking-widest">Item Name</label>
              <input
                type="text"
                placeholder="e.g., Ceramic Tile"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="p-4 border border-gray-200 outline-none rounded-2xl focus:ring-2 focus:ring-teal-800 transition-all bg-white"
              />
            </div>

            <div className="flex flex-col">
              <label className="block mb-2 text-xs font-black uppercase text-gray-400 tracking-widest">Rate (₹ / sq.ft)</label>
              <input
                type="number"
                placeholder="0.00"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="p-4 border border-gray-200 outline-none rounded-2xl focus:ring-2 focus:ring-teal-800 transition-all bg-white"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block mb-2 text-xs font-black uppercase text-gray-400 tracking-widest">Description</label>
            <textarea
              placeholder="Add specific details or material quality..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full p-4 border border-gray-200 outline-none resize-none rounded-2xl focus:ring-2 focus:ring-teal-800 transition-all bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <label className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="hidden"
              />
              <span className="inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all bg-teal-900 shadow-lg cursor-pointer rounded-2xl hover:bg-teal-800 active:scale-95">
                <ImageIcon size={20} className="mr-2" />
                {image ? "Change Image" : "Upload Image"}
              </span>
            </label>

            {image && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 animate-in zoom-in-95">
                <CheckCircle size={16} />
                <span className="text-sm font-bold truncate max-w-[200px]">{image.name}</span>
                <button onClick={() => setImage(null)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
              </div>
            )}

            <button
              onClick={handleAddOrUpdate}
              disabled={isSubmitting}
              className="px-10 py-4 ml-auto font-black text-white transition-all bg-teal-600 shadow-xl rounded-2xl hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : "Save Item Rate"}
            </button>
          </div>
        </div>

        {/* Rates Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rates.map((item) => (
            <div key={item._id} className="group relative p-6 bg-white border border-gray-100 shadow-md rounded-[2rem] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              
              <div className="w-full h-40 mb-6 overflow-hidden rounded-2xl bg-gray-50 border border-gray-50 flex items-center justify-center">
                {item.imageBase64 || item.image ? (
                  <img src={item.imageBase64 || item.image} alt={item.itemName} className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <ImageIcon size={40} className="text-gray-200" />
                )}
              </div>

              <button 
                onClick={() => handleDelete(item._id, item.itemName)} 
                className="absolute p-2 text-red-500 top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-red-50 transition-colors"
              >
                <Trash2 size={18} />
              </button>

              <h3 className="text-xl font-black text-teal-900 truncate mb-1">{item.itemName}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] leading-relaxed mb-4">{item.description || "No description provided."}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                {editingItem === item._id ? (
                  <div className="flex items-center gap-2 w-full animate-in fade-in zoom-in-95">
                    <input 
                      type="number" 
                      value={newRate} 
                      onChange={(e) => setNewRate(e.target.value)} 
                      className="w-full p-2 border-2 border-teal-500 rounded-xl outline-none font-bold text-teal-900" 
                      autoFocus
                    />
                    <button onClick={() => handleEditSave(item._id, item.itemName)} className="p-2 bg-teal-600 text-white rounded-xl shadow-md"><CheckCircle size={20}/></button>
                    <button onClick={() => setEditingItem(null)} className="p-2 bg-gray-100 text-gray-500 rounded-xl"><X size={20}/></button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Current Rate</span>
                      <span className="text-2xl font-black text-teal-600">₹{item.rate}</span>
                    </div>
                    <button 
                      onClick={() => { setEditingItem(item._id); setNewRate(item.rate); }} 
                      className="flex items-center px-5 py-2.5 text-sm font-bold text-teal-700 bg-teal-50 rounded-xl hover:bg-teal-100 transition-all border border-teal-100"
                    >
                      <Edit3 size={14} className="mr-2" /> Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {rates.length === 0 && !loading && (
          <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 mt-10">
            <p className="text-gray-400 font-bold">No rates found. Start by adding your first item above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper for Lucide consistency
const PlusCircle = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

export default ManageRates;