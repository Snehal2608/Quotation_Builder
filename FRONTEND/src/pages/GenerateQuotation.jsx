import React, { useState, useEffect } from "react";
import { PlusCircle, Calculator, Download, RefreshCw, AlertCircle, X } from "lucide-react";
import { useRates } from "../context/RateContext";
import { useQuote } from "../context/QuoteContext";
import Select from "react-select";
import jsPDF from "jspdf";
import axios from "axios";
import Notification from "../components/Notification";

const imageToBase64 = async (imageData) => {
  if (!imageData) return null;
  if (imageData.startsWith("data:image")) return imageData;
  try {
    const response = await fetch(imageData);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error processing image for PDF", error);
    return null;
  }
};

const CustomOption = ({ data, innerRef, innerProps }) => (
  <div ref={innerRef} {...innerProps} className="flex gap-3 p-2 cursor-pointer hover:bg-gray-50">
    {data.image ? (
      <img src={data.image} alt={data.label} className="object-contain w-12 h-10 rounded" />
    ) : (
      <div className="w-12 h-10 bg-gray-200 rounded" />
    )}
    <div>
      <div className="font-semibold text-teal-900">{data.label}</div>
      {data.description && <div className="text-xs text-gray-500">{data.description}</div>}
    </div>
  </div>
);

const CustomSingleValue = ({ data }) => (
  <div className="flex items-center gap-2 leading-none">
    {data.image ? (
      <img src={data.image} alt={data.label} className="object-contain w-6 h-6 bg-white border rounded" />
    ) : (
      <div className="w-6 h-6 bg-gray-200 rounded" />
    )}
    <span className="text-sm font-medium text-gray-700">{data.label}</span>
  </div>
);

const ResultItemLayout = ({ item }) => (
  <div className="flex items-start gap-3 py-2">
    {item.image && (
      <div className="flex-shrink-0 mt-1">
        <img src={item.image} alt={item.name} className="object-contain w-10 h-8 bg-white border rounded shadow-sm" />
      </div>
    )}
    <div className="flex flex-col min-w-0">
      <span className="block text-sm font-bold leading-tight text-teal-900 uppercase truncate">
        {item.name}
      </span>
      {item.customDescription && (
        <p className="mt-1 text-[11px] text-gray-600 line-clamp-2" title={item.customDescription}>
          {item.customDescription}
        </p>
      )}
    </div>
  </div>
);

const GenerateQuotation = () => {
  const { rates, fetchRates } = useRates();
  const { quoteItems, addItem, resetQuote } = useQuote();

  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [inputData, setInputData] = useState({ item: "", length: "", height: "", description: "" });
  const [adminLogo, setAdminLogo] = useState(null);
  const [notify, setNotify] = useState({ type: "", message: "" });

  // Restored States for Complaints/Inbox
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaint, setComplaint] = useState({ category: "Price Issue", title: "", message: "" });
  const [myMessages, setMyMessages] = useState([]);
  const [showMyMessages, setShowMyMessages] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    fetchRates();
    const interval = setInterval(() => fetchRates(), 5000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  useEffect(() => {
    if (user?.role === "admin") {
      if (user.logoUrl || user.logoBase64) setAdminLogo(user.logoUrl || user.logoBase64);
    } else if (user?.adminId) {
      axios.get(`http://localhost:5000/api/auth/admin-logo/${user.adminId}`)
        .then(res => setAdminLogo(res.data.logoBase64 || res.data.logoUrl))
        .catch(() => {});
    }
    fetchMyMessages();
  }, [user]);

  const fetchMyMessages = async () => {
    try {
      if (!token) return;
      const res = await axios.get("http://localhost:5000/api/messages/my-messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyMessages(res.data || []);
    } catch (err) {
      console.error("Fetch messages error", err);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const l = parseFloat(inputData.length);
    const h = parseFloat(inputData.height);

    if (!inputData.item || isNaN(l) || isNaN(h) || l <= 0 || h <= 0) {
      setNotify({ type: "error", message: "Select item and enter valid dimensions." });
      return;
    }

    const rateItem = rates.find(r => r.itemName === inputData.item);
    const costValue = l * h * (rateItem?.rate || 0);

    addItem({
      id: Date.now(),
      name: inputData.item,
      length: l.toFixed(1),
      height: h.toFixed(1),
      rate: rateItem?.rate || 0,
      cost: Number(costValue),
      image: rateItem?.imageBase64 || rateItem?.image,
      customDescription: inputData.description
    });

    setInputData({ item: "", length: "", height: "", description: "" });
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    try {
      if (!complaint.title || !complaint.message) {
        setNotify({ type: "error", message: "Title and message are required." });
        return;
      }
      await axios.post("http://localhost:5000/api/messages/send", complaint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotify({ type: "success", message: "Issue reported to admin." });
      setShowComplaintModal(false);
      fetchMyMessages();
    } catch (err) {
      setNotify({ type: "error", message: "Failed to report issue." });
    }
  };

  const totalCost = quoteItems.reduce((sum, item) => sum + item.cost, 0);
  const discountedTotal = Math.max(totalCost - appliedDiscount, 0);

  const applyDiscount = () => {
    const percent = parseFloat(discountInput) || 0;
    if (percent < 0) return;
    setAppliedDiscount((totalCost * percent) / 100);
  };

  const handleDownloadReceipt = async () => {
    if (!quoteItems.length) return;
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let startY = 130;

    let logo64 = await imageToBase64(adminLogo);
    if (logo64) doc.addImage(logo64, "PNG", margin, 50, 50, 50);
    doc.setFontSize(10).text(`Date: ${new Date().toLocaleDateString("en-IN")}`, pageWidth - margin, 80, { align: "right" });

    doc.setDrawColor(200).line(margin, startY, pageWidth - margin, startY);
    doc.setFont("helvetica", "bold").text("ITEM / DESCRIPTION", margin + 70, startY + 15);
    doc.text("DIMENSIONS", pageWidth - 180, startY + 15, { align: "center" });
    doc.text("COST", pageWidth - margin, startY + 15, { align: "right" });
    startY += 25;
    doc.line(margin, startY, pageWidth - margin, startY);
    startY += 30;

    for (const item of quoteItems) {
      if (startY + 100 > pageHeight - 120) { doc.addPage(); startY = 60; }
      const img = await imageToBase64(item.image);
      if (img) doc.addImage(img, "PNG", margin, startY, 55, 55);
      
      doc.setDrawColor(235).line(margin + 65, startY, margin + 65, startY + 55);
      doc.setFontSize(11).setFont("helvetica", "bold").setTextColor(0).text(item.name.toUpperCase(), margin + 75, startY + 12);
      doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(100).text(doc.splitTextToSize(item.customDescription || "", 200), margin + 75, startY + 28);
      doc.setTextColor(0).text(`${item.length} x ${item.height} ft`, pageWidth - 180, startY + 12, { align: "center" });
      doc.setFont("helvetica", "bold").text(`Rs. ${item.cost.toLocaleString()}`, pageWidth - margin, startY + 12, { align: "right" });
      startY += 80;
    }

    if (startY + 150 > pageHeight) { doc.addPage(); startY = 60; }
    doc.setDrawColor(200).line(margin, startY, pageWidth - margin, startY);
    startY += 25;
    doc.setFontSize(10).setFont("helvetica", "normal").text("Subtotal:", pageWidth - 150, startY);
    doc.text(`Rs. ${totalCost.toLocaleString()}`, pageWidth - margin, startY, { align: "right" });
    
    if (appliedDiscount > 0) {
      startY += 20;
      doc.text(`Discount (${discountInput}%):`, pageWidth - 150, startY);
      doc.text(`- Rs. ${appliedDiscount.toLocaleString()}`, pageWidth - margin, startY, { align: "right" });
    }

    startY += 30;
    doc.setFontSize(12).setFont("helvetica", "bold").text("Final Total:", pageWidth - 150, startY);
    doc.text(`Rs. ${discountedTotal.toLocaleString()}`, pageWidth - margin, startY, { align: "right" });

    doc.setFontSize(10).text("Authorized Signature", margin, startY + 60);
    doc.line(margin, startY + 85, margin + 150, startY + 85);
    doc.save(`Quotation_${Date.now()}.pdf`);
  };

  return (
    <div className="flex items-start justify-center min-h-screen py-8 bg-gray-100">
      <div className="w-full max-w-6xl p-6 bg-white shadow-xl rounded-[2.5rem] md:p-10">
        {notify.message && <Notification type={notify.type} message={notify.message} onClose={() => setNotify({ type: "", message: "" })} />}

        <div className="flex flex-col justify-between mb-8 sm:flex-row sm:items-center">
          <h2 className="text-4xl font-extrabold text-teal-900">Generate Quotation</h2>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <button onClick={handleDownloadReceipt} className="flex items-center gap-2 px-6 py-2.5 text-white bg-teal-900 shadow-md rounded-xl hover:bg-teal-800 transition-all">
              <Download size={18} /> Receipt PDF
            </button>
            {user?.role === "user" && (
              <button onClick={() => setShowComplaintModal(true)} className="flex items-center gap-2 px-6 py-2.5 text-white bg-teal-900 shadow-md rounded-xl hover:bg-teal-800 transition-all">
                <AlertCircle size={18} /> Report Issue
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* INPUT PANEL */}
          <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-[2rem]">
            <h3 className="flex items-center pb-4 mb-6 text-2xl font-bold text-teal-900 border-b">
              <Calculator className="mr-2" /> Calculation Input
            </h3>
            <form onSubmit={handleAddItem} className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-bold text-gray-600">Select Item</label>
                <Select
                  options={rates.map(r => ({ value: r.itemName, label: `${r.itemName} (Rs.${r.rate}/sq.ft)`, image: r.imageBase64 || r.image, description: r.description }))}
                  value={rates.find(r => r.itemName === inputData.item) ? { value: inputData.item, label: inputData.item } : null}
                  onChange={(s) => setInputData({ ...inputData, item: s ? s.value : "" })}
                  components={{ Option: CustomOption, SingleValue: CustomSingleValue }}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-bold text-gray-600">Length (ft)</label>
                  <input type="number" step="0.1" value={inputData.length} onChange={(e) => setInputData({ ...inputData, length: e.target.value })} className="w-full p-3 border rounded-xl outline-none focus:ring-1 focus:ring-teal-800" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-bold text-gray-600">Height (ft)</label>
                  <input type="number" step="0.1" value={inputData.height} onChange={(e) => setInputData({ ...inputData, height: e.target.value })} className="w-full p-3 border rounded-xl outline-none focus:ring-1 focus:ring-teal-800" />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-bold text-gray-600">Item Description (Optional)</label>
                <textarea rows={2} value={inputData.description} onChange={(e) => setInputData({ ...inputData, description: e.target.value })} className="w-full p-3 border rounded-xl resize-none outline-none focus:ring-1 focus:ring-teal-800" placeholder="Enter custom notes..." />
              </div>
              <button type="submit" className="w-full py-4 bg-teal-900 text-white font-bold rounded-xl shadow-lg hover:bg-teal-800 flex justify-center items-center gap-2">
                <PlusCircle size={20} /> Add Item
              </button>
            </form>
          </div>

          {/* LIVE CALCULATION PANEL */}
          <div className="p-8 border bg-gray-50/50 rounded-[2rem] shadow-lg">
            <h3 className="pb-4 mb-6 text-2xl font-bold text-teal-900 border-b">Live Calculation</h3>
            {quoteItems.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-2xl">
                <Calculator size={40} className="opacity-20 mb-2" />
                <p>Your quotation is empty</p>
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto mb-6 bg-white rounded-2xl border">
                  <table className="w-full divide-y">
                    <thead className="bg-gray-50 text-[10px] uppercase font-bold text-teal-900">
                      <tr><th className="p-3 text-left">Item</th><th className="p-3 text-right">Cost</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {quoteItems.map(item => (
                        <tr key={item.id}><td className="p-3"><ResultItemLayout item={item} /></td><td className="p-3 text-right font-bold text-gray-800">₹{item.cost.toLocaleString()}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input type="number" placeholder="Discount %" value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} className="w-full p-2 border rounded-xl text-sm outline-none" />
                    <button onClick={applyDiscount} className="bg-teal-900 text-white px-4 py-2 rounded-xl text-sm font-bold">Apply</button>
                  </div>
                  <div className="bg-teal-800 text-white p-5 rounded-2xl shadow-md flex justify-between items-center">
                    <span className="text-xs font-bold uppercase opacity-80">Grand Total</span>
                    <span className="text-2xl font-black">₹{discountedTotal.toLocaleString()}</span>
                  </div>
                  <button onClick={() => { resetQuote(); setAppliedDiscount(0); setDiscountInput(""); }} className="w-full mt-4 text-red-500 font-bold hover:bg-red-50 py-2 rounded-xl text-sm transition-colors">Reset List</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* COMMUNICATION HISTORY (INBOX) */}
        {user?.role === "user" && (
          <div className="pt-8 mt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-teal-900">Communication History</h3>
              <button onClick={() => setShowMyMessages(!showMyMessages)} className="px-5 py-2 text-sm font-bold text-white bg-teal-900 rounded-full shadow-md">
                {showMyMessages ? "Hide Inbox" : "View Messages"}
              </button>
            </div>
            {showMyMessages && (
              <div className="space-y-4">
                {myMessages.length === 0 ? <p className="text-gray-400">No messages found.</p> : 
                  myMessages.map((m) => (
                    <div key={m._id} className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-gray-400">{m.category}</span>
                        <span className="text-xs font-bold uppercase px-2 py-1 bg-gray-100 rounded-full">{m.status}</span>
                      </div>
                      <p className="text-sm font-bold text-teal-900">Subject: <span className="font-normal text-gray-600">{m.title}</span></p>
                      <p className="text-sm font-bold text-teal-900">Message: <span className="font-normal text-gray-600">{m.message}</span></p>
                      {m.reply && (
                        <div className="mt-4 p-4 bg-gray-50 border-l-4 border-teal-900 rounded-xl italic text-sm text-gray-800">
                          "Admin: {m.reply}"
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}

        {/* REPORT ISSUE MODAL */}
        {showComplaintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-[2.5rem]">
              <h3 className="mb-2 text-2xl font-black text-teal-900">Report an Issue</h3>
              <form onSubmit={submitComplaint} className="flex flex-col gap-4">
                <select value={complaint.category} onChange={(e) => setComplaint({ ...complaint, category: e.target.value })} className="p-4 font-medium border border-gray-100 outline-none bg-gray-50 rounded-2xl focus:ring-2 focus:ring-teal-800">
                  <option>Price Issue</option>
                  <option>Work Issue</option>
                  <option>Other</option>
                </select>
                <input value={complaint.title} onChange={(e) => setComplaint({ ...complaint, title: e.target.value })} placeholder="Subject" className="p-4 font-medium border border-gray-100 outline-none bg-gray-50 rounded-2xl focus:ring-2 focus:ring-teal-800" required />
                <textarea value={complaint.message} onChange={(e) => setComplaint({ ...complaint, message: e.target.value })} placeholder="Describe what happened..." className="h-32 p-4 font-medium border border-gray-100 outline-none resize-none bg-gray-50 rounded-2xl focus:ring-2 focus:ring-teal-800" required />
                <div className="flex gap-3 mt-2">
                  <button type="submit" className="flex-1 py-4 font-bold text-white bg-teal-900 shadow-lg hover:bg-teal-800 rounded-2xl">Submit Report</button>
                  <button type="button" onClick={() => setShowComplaintModal(false)} className="px-6 py-4 font-bold text-gray-900">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateQuotation;