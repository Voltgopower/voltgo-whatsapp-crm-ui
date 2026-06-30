import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

function getDefaultCategory(relatedType) {
  if (relatedType === "shipment") return "commercial_invoice";
  return "payment_proof";
}

function getCategoryOptions(relatedType) {
  if (relatedType === "shipment") {
    return [
      { value: "commercial_invoice", label: "Commercial Invoice" },
      { value: "packing_list", label: "Packing List" },
      { value: "bill_of_lading", label: "Bill of Lading" },
      { value: "arrival_notice", label: "Arrival Notice" },
      { value: "proof_of_delivery", label: "Proof of Delivery" },
      { value: "inspection_photo", label: "Inspection Photo" },
      { value: "other", label: "Other" },
    ];
  }

  return [
    { value: "payment_proof", label: "Payment Proof" },
    { value: "invoice", label: "Invoice" },
    { value: "shipping", label: "Shipping Document" },
    { value: "test_report", label: "Test Report" },
    { value: "warranty", label: "Warranty" },
    { value: "customer_photo", label: "Customer Photo" },
    { value: "other", label: "Other" },
  ];
}

export default function DocumentPage({
  relatedType = "",
  relatedId = "",
  compact = false,
}) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: getDefaultCategory(relatedType),
    file: null,
  });

  const categoryOptions = getCategoryOptions(relatedType);
function getCategoryLabel(value, relatedType) {
  const options = getCategoryOptions(relatedType);
  return options.find((item) => item.value === value)?.label || value || "-";
}

  async function loadDocuments() {
    const params = {};

    if (relatedType) params.related_type = relatedType;
    if (relatedId) params.related_id = relatedId;

    const res = await axios.get(`${API_BASE}/portal/documents`, { params });
    setDocuments(Array.isArray(res.data) ? res.data : []);
  }

  async function uploadDocument(e) {
    e.preventDefault();

    if (!form.file) {
      alert("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", form.file);
      formData.append("title", form.title || form.file.name);
      formData.append("category", form.category);

      if (relatedType) {
        formData.append("related_type", relatedType);
      }

      if (relatedId) {
        formData.append("related_id", relatedId);
      }

      await axios.post(`${API_BASE}/portal/documents`, formData);

      setForm({
        title: "",
        category: getDefaultCategory(relatedType),
        file: null,
      });

      e.target.reset();

      await loadDocuments();
    } catch (err) {
      console.error("Upload document failed:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function openDocument(id) {
    setOpeningId(id);

    try {
      const res = await axios.get(`${API_BASE}/portal/documents/${id}`);

      if (res.data?.download_url) {
        window.open(res.data.download_url, "_blank");
      } else {
        alert("Download URL not found");
      }
    } catch (err) {
      console.error("Open document failed:", err);
      alert("Failed to open document");
    } finally {
      setOpeningId(null);
    }
  }

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      category: getDefaultCategory(relatedType),
    }));

    loadDocuments();
  }, [relatedType, relatedId]);

    return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {!compact && (
        <div>
          <div className="text-2xl font-bold">Evidence</div>
          <div className="text-sm text-gray-500">
            Store official evidence for future reference.
          </div>
        </div>
      )}

      {compact && showUpload && (
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <div className="text-lg font-semibold mb-4">
            {relatedType === "shipment"
              ? "Upload Shipment Evidence"
              : "Upload Evidence"}
          </div>

          <form
            onSubmit={uploadDocument}
            className="grid grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="block text-sm text-gray-500 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Evidence title"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Evidence Type
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {categoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">File</label>
              <input
                type="file"
                onChange={(e) =>
                  setForm({ ...form, file: e.target.files?.[0] || null })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Evidence"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
  <div className="font-semibold">Evidence</div>

  {compact && (
    <button
      type="button"
      onClick={() => setShowUpload((prev) => !prev)}
      className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50 text-sm"
    >
      {showUpload ? "Cancel" : "+ Upload Evidence"}
    </button>
  )}
</div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-5 py-3">Title</th>
              <th className="text-left px-5 py-3">Evidence Type</th>
              <th className="text-left px-5 py-3">File Name</th>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-5 py-3 font-medium">{d.title}</td>
                <td className="px-5 py-3">
                 {getCategoryLabel(d.category, relatedType)}
                </td>
                <td className="px-5 py-3">{d.file_name}</td>
                <td className="px-5 py-3">
                  {d.created_at ? d.created_at.slice(0, 10) : "-"}
                </td>
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => openDocument(d.id)}
                    disabled={openingId === d.id}
                    className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50"
                  >
                    {openingId === d.id ? "Opening..." : "Open"}
                  </button>
                </td>
              </tr>
            ))}

            {documents.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-gray-500" colSpan="5">
                  No evidence uploaded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}