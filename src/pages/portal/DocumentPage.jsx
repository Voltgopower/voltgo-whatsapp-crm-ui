import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

function getDefaultCategory(relatedType) {
  if (relatedType === "shipment") return "commercial_invoice";
  if (relatedType === "payment") return "wire_receipt";
  if (relatedType === "batch") return "purchase_order";
  return "other";
}

function getDocumentTitle(relatedType) {
  if (relatedType === "shipment") return "Shipment Documents";
  if (relatedType === "payment") return "Payment Evidence";
  if (relatedType === "batch") return "Batch Documents";
  return "Document Center";
}

function getDocumentDescription(relatedType) {
  if (relatedType === "shipment") {
    return "Store shipment documents such as invoice, packing list, B/L, photos, and delivery records.";
  }

  if (relatedType === "payment") {
    return "Store payment evidence such as wire receipts, ACH confirmations, check scans, and remittance advice.";
  }

  if (relatedType === "batch") {
    return "Store batch-level documents such as purchase orders, contracts, and project notes.";
  }

  return "Search and manage documents across batches, shipments, and payments.";
}

function getUploadButtonText(relatedType) {
  if (relatedType === "payment") return "+ Upload Evidence";
  return "+ Upload Document";
}

function getCategoryOptions(relatedType) {
  if (relatedType === "shipment") {
    return [
      { value: "commercial_invoice", label: "Commercial Invoice" },
      { value: "packing_list", label: "Packing List" },
      { value: "bill_of_lading", label: "Bill of Lading" },
      { value: "customs_document", label: "Customs Document" },
      { value: "delivery_receipt", label: "Proof of Delivery" },
      { value: "loading_photo", label: "Loading Photo" },
      { value: "other", label: "Other" },
    ];
  }

  if (relatedType === "payment") {
    return [
      { value: "wire_receipt", label: "Wire Receipt" },
      { value: "ach_confirmation", label: "ACH Confirmation" },
      { value: "check_scan", label: "Check Scan" },
      { value: "remittance_advice", label: "Remittance Advice" },
      { value: "bank_receipt", label: "Bank Receipt" },
      { value: "payment_proof", label: "Payment Proof" },
      { value: "other", label: "Other" },
    ];
  }

  if (relatedType === "batch") {
    return [
      { value: "purchase_order", label: "Purchase Order" },
      { value: "sales_contract", label: "Sales Contract" },
      { value: "customer_contract", label: "Customer Contract" },
      { value: "project_note", label: "Project Note" },
      { value: "other", label: "Other" },
    ];
  }

  return [
    { value: "commercial_invoice", label: "Commercial Invoice" },
    { value: "purchase_order", label: "Purchase Order" },
    { value: "packing_list", label: "Packing List" },
    { value: "bill_of_lading", label: "Bill of Lading" },
    { value: "wire_receipt", label: "Wire Receipt" },
    { value: "payment_proof", label: "Payment Proof" },
    { value: "other", label: "Other" },
  ];
}

function getCategoryLabel(value, relatedType) {
  const options = getCategoryOptions(relatedType);
  const label = options.find((item) => item.value === value)?.label;

  if (label) return label;

  const fallbackMap = {
    invoice: "Commercial Invoice",
    commercial_invoice: "Commercial Invoice",
    payment_proof: "Payment Proof",
    purchase_order: "Purchase Order",
    bill_of_lading: "Bill of Lading",
    packing_list: "Packing List",
    wire_receipt: "Wire Receipt",
    ach_confirmation: "ACH Confirmation",
    check_scan: "Check Scan",
    remittance_advice: "Remittance Advice",
    bank_receipt: "Bank Receipt",
    customs_document: "Customs Document",
    delivery_receipt: "Proof of Delivery",
    loading_photo: "Loading Photo",
    sales_contract: "Sales Contract",
    customer_contract: "Customer Contract",
    project_note: "Project Note",
    other: "Other",
  };

  return fallbackMap[value] || value || "-";
}

function getRelatedTagClass(type) {
  if (type === "Batch") {
    return "bg-blue-50 text-blue-700";
  }

  if (type === "Shipment") {
    return "bg-green-50 text-green-700";
  }

  if (type === "Payment") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-gray-100 text-gray-700";
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
  const [searchText, setSearchText] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: getDefaultCategory(relatedType),
    file: null,
  });

  const documentTitle = getDocumentTitle(relatedType);
  const categoryOptions = getCategoryOptions(relatedType);

  const filteredDocuments = documents.filter((doc) => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return true;

    return [
      doc.title,
      doc.category,
      doc.file_name,
      doc.related_type_label,
      doc.related_label,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

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

      if (relatedType) formData.append("related_type", relatedType);
      if (relatedId) formData.append("related_id", relatedId);

      await axios.post(`${API_BASE}/portal/documents`, formData);

      setForm({
        title: "",
        category: getDefaultCategory(relatedType),
        file: null,
      });

      e.target.reset();
      setShowUpload(false);

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
          <div className="text-2xl font-bold">{documentTitle}</div>
          <div className="text-sm text-gray-500">
            {getDocumentDescription(relatedType)}
          </div>
        </div>
      )}

      {compact && showUpload && (
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <div className="text-lg font-semibold mb-4">
            Upload {documentTitle}
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
                placeholder="Document title"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Document Type
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
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
              {uploading ? "Uploading..." : `Upload ${documentTitle}`}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <div className="font-semibold">{documentTitle}</div>

            {compact && (
              <div className="text-sm text-gray-500 mt-1">
                {getDocumentDescription(relatedType)}
              </div>
            )}
          </div>

          {compact && (
            <button
              type="button"
              onClick={() => setShowUpload((prev) => !prev)}
              className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50 text-sm"
            >
              {showUpload ? "Cancel" : getUploadButtonText(relatedType)}
            </button>
          )}
        </div>

        {!compact && (
          <div className="px-5 py-4 border-b bg-gray-50">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Search title, file name, related batch, shipment, or payment..."
            />
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-5 py-3">Title</th>
              <th className="text-left px-5 py-3">Document Type</th>
              <th className="text-left px-5 py-3">Related</th>
              <th className="text-left px-5 py-3">File Name</th>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredDocuments.map((doc) => (
              <tr key={doc.id} className="border-t">
                <td className="px-5 py-3 font-medium">{doc.title || "-"}</td>

                <td className="px-5 py-3">
                  {getCategoryLabel(doc.category, doc.related_type)}
                </td>

                <td className="px-5 py-3">
                  {doc.related_type_label && doc.related_label ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs ${getRelatedTagClass(
                          doc.related_type_label
                        )}`}
                      >
                        {doc.related_type_label}
                      </span>

                      <span>{doc.related_label}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => openDocument(doc.id)}
                    disabled={openingId === doc.id}
                    className="text-left text-gray-900 hover:underline disabled:opacity-50"
                  >
                    {doc.file_name || "-"}
                  </button>
                </td>

                <td className="px-5 py-3">
                  {doc.created_at ? String(doc.created_at).slice(0, 10) : "-"}
                </td>

                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => openDocument(doc.id)}
                    disabled={openingId === doc.id}
                    className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50 text-sm disabled:opacity-50"
                  >
                    {openingId === doc.id ? "Opening..." : "Open"}
                  </button>
                </td>
              </tr>
            ))}

            {filteredDocuments.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-gray-500" colSpan="6">
                  No documents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}