import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export default function DocumentPage() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    category: "payment_proof",
    file: null,
  });

  async function loadDocuments() {
    const res = await axios.get(`${API_BASE}/portal/documents`);
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

      await axios.post(`${API_BASE}/portal/documents`, formData);

      setForm({
        title: "",
        category: "payment_proof",
        file: null,
      });

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
    loadDocuments();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-bold">Documents</div>
        <div className="text-sm text-gray-500">
          Upload and archive payment, shipment, invoice, and warranty files.
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="text-lg font-semibold mb-4">Upload Document</div>

        <form onSubmit={uploadDocument} className="space-y-4 max-w-3xl">
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
            <label className="block text-sm text-gray-500 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="payment_proof">Payment Proof</option>
              <option value="invoice">Invoice</option>
              <option value="shipping">Shipping Document</option>
              <option value="test_report">Test Report</option>
              <option value="warranty">Warranty</option>
              <option value="customer_photo">Customer Photo</option>
              <option value="other">Other</option>
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
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b font-semibold">Document List</div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-5 py-3">Title</th>
              <th className="text-left px-5 py-3">Category</th>
              <th className="text-left px-5 py-3">File Name</th>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-5 py-3 font-medium">{d.title}</td>
                <td className="px-5 py-3">{d.category}</td>
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
                  No documents yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}