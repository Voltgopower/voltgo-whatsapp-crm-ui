import React, { useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

function defaultBatchNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  return `VG-${y}${m}${d}-001`;
}

export default function NewBatchPage({ onCancel, onCreated }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    dealer_name: "",
    batch_no: defaultBatchNo(),
    po_number: "",
    reference: "",
    notes: "",
  });

  async function createBatch(e) {
    e.preventDefault();

    if (!form.dealer_name.trim()) {
      alert("Dealer is required");
      return;
    }

    if (!form.batch_no.trim()) {
      alert("Batch No is required");
      return;
    }

    setSaving(true);

    try {
      console.log("New batch form =", form);
      const res = await axios.post(`${API_BASE}/portal/batches`, {
  ...form,
});

onCreated(res.data);
    } catch (err) {
      console.error("Create batch failed:", err);
      alert("Create batch failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="text-xl font-semibold mb-2">New Batch</div>
      <div className="text-sm text-gray-500 mb-6">
        Create a new official business record.
      </div>

      <form onSubmit={createBatch} className="space-y-5 max-w-3xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Dealer
            </label>
            <input
              value={form.dealer_name}
              onChange={(e) =>
                setForm({ ...form, dealer_name: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="ABC RV Solutions"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Batch No
            </label>
            <input
              value={form.batch_no}
              onChange={(e) =>
                setForm({ ...form, batch_no: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="VG-20260629-001"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">
              PO Number
            </label>
            <input
              value={form.po_number}
              onChange={(e) =>
                setForm({ ...form, po_number: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="PO-001"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Reference
            </label>
            <input
              value={form.reference}
              onChange={(e) =>
                setForm({ ...form, reference: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Project / email / sales reference"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm min-h-[100px]"
            placeholder="Internal notes..."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Batch"}
          </button>
        </div>
      </form>
    </div>
  );
}