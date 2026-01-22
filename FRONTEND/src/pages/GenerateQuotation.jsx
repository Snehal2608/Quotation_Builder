import React, { useState, useEffect } from "react";
import { PlusCircle, Calculator, Download, RefreshCw, AlertCircle } from "lucide-react";
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
  <div
    ref={innerRef}
    {...innerProps}
    className="flex gap-3 p-2 cursor-pointer hover:bg-[#e9fffd]"
  >
    {data.image && (
      <img
        src={data.image}
        alt={data.label}
        className="object-contain w-12 h-10 rounded"
      />
    )}
    <div>
      <div className="font-semibold text-[#004e64]">{data.label}</div>
      {data.description && (
        <div className="text-xs text-gray-500">{data.description}</div>
      )}
    </div>
  </div>
);

const CustomSingleValue = ({ data }) => (
  <div className="flex items-center gap-2 leading-none">
    {data.image && (
      <img
        src={data.image}
        alt={data.label}
        className="object-contain w-6 h-6 bg-white border rounded"
      />
    )}
    <span className="text-sm font-medium leading-none text-gray-700">
      {data.label}
    </span>
  </div>
);

const ResultItemLayout = ({ item }) => (
  <div className="flex items-center gap-3 py-1">
    {item.image && (
      <div className="flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="object-contain w-10 h-8 bg-white border rounded shadow-sm"
        />
      </div>
    )}
    <div className="flex flex-col min-w-0 overflow-hidden">
      <span className="text-sm font-bold leading-tight text-[#004e64] uppercase truncate block">
        {item.name}
      </span>
      {item.description && (
        <span className="text-[10px] text-gray-400 leading-tight truncate mt-0.5 block">
          {item.description}
        </span>
      )}
    </div>
  </div>
);

const GenerateQuotation = () => {
  const { rates } = useRates();
  const { quoteItems, addItem, resetQuote } = useQuote();

  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const [inputData, setInputData] = useState({
    item: "",
    length: 0.0,
    height: 0.0,
  });

  const [adminLogo, setAdminLogo] = useState(null);
  const [adminName, setAdminName] = useState("Admin");
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaint, setComplaint] = useState({ category: "Price Issue", title: "", message: "" });
  const [myMessages, setMyMessages] = useState([]);
  const [showMyMessages, setShowMyMessages] = useState(false);
  const [notify, setNotify] = useState({ type: "", message: "" });

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    resetQuote();
  }, [user?.role]);

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") {
      setAdminName(user.name || "Admin");
      if (user.logoUrl || user.logoBase64) setAdminLogo(user.logoUrl || user.logoBase64);
    } else if (user.role === "user" && user.adminId) {
      fetch(`http://localhost:5000/api/auth/admin-logo/${user.adminId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.logoUrl || data.logoBase64) setAdminLogo(data.logoUrl || data.logoBase64);
          if (data.name) setAdminName(data.name);
        })
        .catch(() => { });
    }
  }, []);

  const fetchMyMessages = async () => {
    try {
      if (!token) return;
      const res = await axios.get("http://localhost:5000/api/messages/my-messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const userOnlyMessages = (res.data || []).filter(
        (msg) => msg.type === "complaint"
      );
      setMyMessages(userOnlyMessages);
      
    } catch (err) {
      console.error("Fetch my messages error:", err);
      setMyMessages([]);
    }
  };

  useEffect(() => { fetchMyMessages(); }, []);

  const adminRates = rates;

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!inputData.item || inputData.length <= 0 || inputData.height <= 0) {
      setNotify({ type: "error", message: "Please select an item and enter valid dimensions." });
      return;
    }

    const rateItem = adminRates.find((r) => r.itemName === inputData.item);
    const costValue = inputData.length * inputData.height * (rateItem?.rate || 0);

    addItem({
      id: Date.now(),
      name: inputData.item,
      length: inputData.length.toFixed(1),
      height: inputData.height.toFixed(1),
      rate: rateItem?.rate || 0,
      cost: Number(costValue),
      description: rateItem?.description || "",
      image: rateItem?.image || rateItem?.imageBase64 || null,
    });

    try {
      await axios.post(
        "http://localhost:5000/api/messages/quotation-notify",
        {
          items: [{ name: inputData.item, length: inputData.length, height: inputData.height, rate: rateItem?.rate || 0, total: costValue }],
          grandTotal: costValue,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Notification error:", err);
    }

    setInputData({ item: "", length: 0.0, height: 0.0 });
  };

  const handleResetQuoteList = () => resetQuote();
  const totalCost = quoteItems.reduce((sum, item) => sum + Number(item.cost), 0);
  const discountedTotal = Math.max(totalCost - appliedDiscount, 0);

  const applyDiscount = () => {
    const percent = Number(discountInput);
    if (isNaN(percent) || percent < 0) {
      setNotify({ type: "error", message: "Invalid discount percentage" });
      return;
    }
    if (user?.role === "user" && percent > 10) {
      setNotify({ type: "error", message: "Maximum discount allowed for users is 10%" });
      return;
    }
    if (user?.role === "admin" && percent > 100) {
      setNotify({ type: "error", message: "Discount cannot exceed 100%" });
      return;
    }
    const discountAmount = (totalCost * percent) / 100;
    setAppliedDiscount(discountAmount);
  };

  useEffect(() => {
    setAppliedDiscount(0);
    setDiscountInput("");
  }, [quoteItems.length]);

  const itemOptions = adminRates.map((r) => ({
    value: r.itemName,
    label: `${r.itemName} (Rs.${r.rate}/sq.ft)`,
    description: r.description,
    image: r.image || r.imageBase64,
  }));

  const openComplaintModal = () => {
    setComplaint({ category: "Price Issue", title: "", message: "" });
    setShowComplaintModal(true);
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    try {
      if (!complaint.title || !complaint.message) {
        setNotify({ type: "error", message: "Please add both title and message." });
        return;
      }
      await axios.post("http://localhost:5000/api/messages/send", complaint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotify({ type: "success", message: "Complaint sent to admin" });
      setShowComplaintModal(false);
      fetchMyMessages();
    } catch (err) {
      setNotify({ type: "error", message: err.response?.data?.message || "Failed to send complaint" });
    }
  };

  const handleDownloadReceipt = async () => {
    if (!quoteItems.length) {
      setNotify({ type: "error", message: "No items to download." });
      return;
    }

    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const bottomMargin = 120;
    const headerY = 50;

    const drawFooter = () => {
      const footerY = pageHeight - 50;
      doc.setDrawColor(220);
      doc.setLineWidth(0.5);
      doc.line(40, footerY, pageWidth - 40, footerY);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text("Thank you for your business!", pageWidth / 2, footerY + 20, { align: "center" });
    };

    let adminLogo64 = null;
    if (adminLogo) adminLogo64 = await imageToBase64(adminLogo);

    if (adminLogo64) {
      const logoSize = 50;
      const format = adminLogo64.includes("png") ? "PNG" : "JPEG";
      doc.addImage(adminLogo64, format, margin, headerY, logoSize, logoSize);
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, pageWidth - margin, headerY + 30, { align: "right" });

    let startY = 140;
    const imageSize = 55;
    const leftX = margin;
    const textX = margin + imageSize + 20;
    const rightX = pageWidth - margin;

    for (const item of quoteItems) {
      if (startY + imageSize + 80 > pageHeight - bottomMargin) {
        drawFooter();
        doc.addPage();
        startY = 60;
      }

      const img = item.image ? await imageToBase64(item.image) : null;
      if (img) {
        doc.addImage(img, img.includes("png") ? "PNG" : "JPEG", leftX, startY, imageSize, imageSize);
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(item.name.toUpperCase(), textX, startY + 16);

      doc.setFontSize(11); 
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(item.description || "-", textX, startY + 36, { maxWidth: 320 });

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Size: ${item.length} × ${item.height} ft`, textX, startY + 52);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(`Rs. ${Number(item.cost).toLocaleString("en-IN")}`, rightX, startY + 32, { align: "right" });

      doc.setDrawColor(230);
      doc.setLineWidth(0.5);
      doc.line(leftX, startY + imageSize + 18, rightX, startY + imageSize + 18);

      startY += imageSize + 60;
    }

    let currentY = startY + 20;
    if (currentY + 120 > pageHeight - bottomMargin) {
      drawFooter();
      doc.addPage();
      currentY = 60;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Subtotal:", rightX - 160, currentY);
    doc.setTextColor(0);
    doc.text(`Rs. ${totalCost.toLocaleString("en-IN")}`, rightX, currentY, { align: "right" });
    
    if (appliedDiscount > 0) {
      currentY += 18;
      doc.setTextColor(100);
      doc.text(`Discount (${discountInput}%):`, rightX - 160, currentY);
      doc.setTextColor(0);
      doc.text(`- Rs. ${appliedDiscount.toLocaleString("en-IN")}`, rightX, currentY, { align: "right" });
    }

    doc.setDrawColor(200);
    doc.line(rightX - 160, currentY + 10, rightX, currentY + 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Final Total:", rightX - 160, currentY + 32);
    doc.text(`Rs. ${discountedTotal.toLocaleString("en-IN")}`, rightX, currentY + 32, { align: "right" });

    let signY = currentY + 80;
    if (signY + 40 > pageHeight - 60) {
      drawFooter();
      doc.addPage();
      signY = 80;
    }

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Authorized Signature", margin, signY);
    doc.setDrawColor(180);
    doc.line(margin, signY + 25, margin + 160, signY + 25);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Stamp / Signature", margin, signY + 40);

    drawFooter();
    doc.save(`Quotation_${Date.now()}.pdf`);
    setNotify({ type: "success", message: "PDF downloaded successfully!" });
  };

  return (
    <div className="flex items-start justify-center min-h-screen py-8 bg-[#cbf3f0]">
      <div className="w-full max-w-6xl p-6 bg-white shadow-xl rounded-[2.5rem] md:p-10">
        {notify.message && (
          <Notification type={notify.type} message={notify.message} onClose={() => setNotify({ type: "", message: "" })} />
        )}

        <div className="flex flex-col justify-between mb-8 sm:flex-row sm:items-center">
          <h2 className="text-4xl font-extrabold text-left text-[#004e64]">Generate Quotation</h2>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <button onClick={handleDownloadReceipt} className="flex items-center justify-center gap-2 px-6 py-2.5 text-white bg-[#06d6a0] shadow-md rounded-xl hover:bg-[#05bc8c] transition-all">
              <Download size={18} /> Receipt PDF
            </button>
            {user?.role === "user" && (
              <button onClick={openComplaintModal} className="flex items-center justify-center gap-2 px-6 py-2.5 text-white bg-[#ef476f] shadow-md rounded-xl hover:bg-[#d00000] transition-all">
                <AlertCircle size={18} className="mr-1" /> Report Issue
              </button>
            )}
          </div>
        </div>

        <div className="grid items-stretch grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Input Panel */}
          <div className="flex flex-col p-8 bg-white border border-[#e9fffd] shadow-sm rounded-[2rem] hover:shadow-md transition-shadow">
            <h3 className="flex items-center pb-4 mb-6 text-2xl font-bold text-[#004e64] border-b border-[#e9fffd]">
              <Calculator className="w-6 h-6 mr-2 text-[#06d6a0]" /> Calculation Input
            </h3>
            <form onSubmit={handleAddItem} className="flex-grow">
              <div className="mb-6">
                <label className="block mb-2 text-sm font-bold text-gray-600">Select Item</label>
                <Select
                  options={itemOptions}
                  value={itemOptions.find((opt) => opt.value === inputData.item) || null}
                  onChange={(s) => setInputData({ ...inputData, item: s.value })}
                  placeholder="Choose item..."
                  components={{ Option: CustomOption, SingleValue: CustomSingleValue }}
                  styles={{
                    control: (base) => ({ ...base, minHeight: 52, borderRadius: 12, borderColor: "#e2e8f0", boxShadow: "none" }),
                    valueContainer: (base) => ({ ...base, display: "flex", alignItems: "center", padding: "0 12px" }),
                    singleValue: (base) => ({ ...base, display: "flex", alignItems: "center" }),
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block mb-2 text-sm font-bold text-gray-600">Length (ft)</label>
                  <div className="flex">
                    <input type="number" value={inputData.length} onChange={(e) => setInputData({ ...inputData, length: parseFloat(e.target.value) || 0.0 })} step="0.1" min="0" className="w-full h-12 p-3 font-mono text-right border border-gray-200 rounded-l-xl focus:ring-1 focus:ring-[#06d6a0] outline-none" />
                    <span className="flex items-center px-4 bg-[#e9fffd] text-[#004e64] font-bold border-y border-r border-gray-200 rounded-r-xl">ft</span>
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-bold text-gray-600">Height (ft)</label>
                  <div className="flex">
                    <input type="number" value={inputData.height} onChange={(e) => setInputData({ ...inputData, height: parseFloat(e.target.value) || 0.0 })} step="0.1" min="0" className="w-full h-12 p-3 font-mono text-right border border-gray-200 rounded-l-xl focus:ring-1 focus:ring-[#06d6a0] outline-none" />
                    <span className="flex items-center px-4 bg-[#e9fffd] text-[#004e64] font-bold border-y border-r border-gray-200 rounded-r-xl">ft</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 h-14 font-bold text-white bg-[#06d6a0] rounded-xl hover:bg-[#05bc8c] shadow-lg transition-all flex items-center justify-center gap-2">
                  <PlusCircle size={20} /> Add Item
                </button>
                <button type="button" onClick={() => setInputData({ item: "", length: 0.0, height: 0.0 })} className="px-6 font-semibold text-gray-500 transition-colors bg-gray-100 h-14 rounded-xl hover:bg-gray-200">Reset</button>
              </div>
            </form>
          </div>

          {/* Live Preview Panel */}
          <div className="flex flex-col p-8 border border-[#e9fffd] shadow-lg bg-[#f0fdfa] rounded-[2rem]">
            <h3 className="pb-4 mb-6 text-2xl font-bold text-[#004e64] border-b border-teal-100">Live Calculation</h3>
            <div className="flex-grow">
              {quoteItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400 bg-white/50 border-2 border-dashed border-[#06d6a0]/30 rounded-2xl">
                  <Calculator size={40} className="mb-2 opacity-20" />
                  <p>Your quotation is empty</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 overflow-hidden bg-white border border-teal-100 shadow-sm rounded-2xl">
                    <table className="min-w-full divide-y divide-[#e9fffd]">
                      <thead className="bg-[#e9fffd]">
                        <tr>
                          <th className="px-4 py-3 text-xs font-bold text-left text-[#004e64] uppercase tracking-wider">Item</th>
                          <th className="px-4 py-3 text-xs font-bold text-right text-[#004e64] uppercase tracking-wider">Dimensions</th>
                          <th className="px-4 py-3 text-xs font-bold text-right text-[#004e64] uppercase tracking-wider">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e9fffd]">
                        {quoteItems.map((item) => (
                          <tr key={item.id} className="hover:bg-[#f0fdfa] transition-colors">
                            <td className="px-4 py-2 align-middle"><ResultItemLayout item={item} /></td>
                            <td className="px-4 py-2 font-mono text-xs text-right text-gray-500 align-middle">{item.length} × {item.height} ft</td>
                            <td className="px-4 py-2 text-sm font-bold text-right text-[#06d6a0] align-middle">₹{Number(item.cost).toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-4">
                    <input
                      type="number"
                      placeholder="Discount %"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      className="w-32 p-2 text-sm border border-gray-300 rounded-xl"
                    />
                    <button onClick={applyDiscount} className="px-4 py-2 text-sm font-semibold text-white bg-[#00b4d8] rounded-xl hover:bg-[#0096b4]">Apply</button>
                  </div>

                  {appliedDiscount > 0 && (
                    <div className="flex justify-between mt-2 text-sm text-red-500">
                      <span>Discount ({discountInput}%)</span>
                      <span>- ₹{appliedDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between px-5 py-4 mt-4 text-white bg-[#06d6a0] shadow-md rounded-xl">
                    <span className="text-sm font-semibold tracking-wide uppercase opacity-90">Grand Total</span>
                    <span className="text-2xl font-extrabold">₹{discountedTotal.toLocaleString("en-IN")}</span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-6">
              <button onClick={handleResetQuoteList} disabled={quoteItems.length === 0} className={`w-full py-3 px-4 font-bold rounded-xl transition-all ${quoteItems.length === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white text-red-500 border border-red-100 hover:bg-red-50 shadow-sm"}`}>Reset Quote List</button>
            </div>
          </div>
        </div>

        {/* Message Inbox Section */}
        {user?.role === "user" && (
          <div className="pt-8 mt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#004e64]">Communication History</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowMyMessages((s) => !s);
                    if (!showMyMessages) fetchMyMessages();
                  }}
                  className="px-5 py-2 text-sm font-bold text-white bg-[#00b4d8] rounded-full shadow-md hover:bg-[#0096b4] transition-all"
                >
                  {showMyMessages ? "Hide Inbox" : "View Messages"}
                </button>
                <button onClick={fetchMyMessages} className="p-2 text-gray-400 hover:text-[#06d6a0] transition-colors">
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>

            {showMyMessages && (
              <div className="space-y-4">
                {myMessages.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 border border-gray-200 border-dashed bg-gray-50 rounded-3xl">
                    No messages found.
                  </div>
                ) : (
                  myMessages.map((m) => (
                    <div
                      key={m._id}
                      className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl"
                    >
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-blue-100 text-blue-700">
                            {m.category || "General"}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </span>

                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              m.status === "unread"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {m.status === "unread" ? "Pending" : "Resolved"}
                          </span>
                        </div>
                      </div>

                      {/* Updated Description/Body Area */}
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-gray-700">
                          Subject:
                          <span className="ml-1 font-normal text-gray-600">
                            {m.title}
                          </span>
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-700">
                          Description:
                          <span className="ml-1 font-normal text-gray-600">
                            {m.message}
                          </span>
                        </p>
                      </div>

                      {/* Admin Reply */}
                      {m.reply && (
                        <div className="mt-4 p-4 bg-[#e9fffd]/60 rounded-xl border-l-4 border-[#06d6a0]">
                          <span className="block mb-1 text-[10px] font-bold uppercase text-[#004e64]">
                            Admin Reply
                          </span>
                          <p className="text-sm italic text-gray-700">
                            "{m.reply}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Report Issue Modal */}
        {showComplaintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#004e64]/60 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-[2.5rem]">
              <h3 className="mb-2 text-2xl font-black text-[#004e64]">Report an Issue</h3>
              <form onSubmit={submitComplaint} className="flex flex-col gap-4">
                <select value={complaint.category} onChange={(e) => setComplaint({ ...complaint, category: e.target.value })} className="p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#06d6a0] font-medium outline-none">
                  <option>Price Issue</option>
                  <option>Work Issue</option>
                  <option>Other</option>
                </select>
                <input value={complaint.title} onChange={(e) => setComplaint({ ...complaint, title: e.target.value })} placeholder="Subject" className="p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#06d6a0] font-medium outline-none" required />
                <textarea value={complaint.message} onChange={(e) => setComplaint({ ...complaint, message: e.target.value })} placeholder="Describe what happened..." className="p-4 bg-gray-50 border-none rounded-2xl h-32 focus:ring-2 focus:ring-[#06d6a0] font-medium resize-none outline-none" required />
                <div className="flex gap-3 mt-2">
                  <button type="submit" className="flex-1 py-4 text-white font-bold bg-[#06d6a0] rounded-2xl shadow-lg hover:bg-[#05bc8c] transition-all">Submit Report</button>
                  <button type="button" onClick={() => setShowComplaintModal(false)} className="px-6 py-4 font-bold text-gray-400 hover:text-gray-600">Cancel</button>
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