import React, { useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export default function BatchFinancialSummary({ batch, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    batch_no: batch.batch_no || "",
    customer_name: batch.customer_name || "",
    invoice_amount: batch.invoice_amount || 0,
    received_amount: batch.received_amount || 0,
    status: batch.status || "draft",
    shipment_date: batch.shipment_date
      ? String(batch.shipment_date).slice(0, 10)
      : "",
  });

  const invoice = Number(batch.invoice_amount || 0);
  const received = Number(batch.received_amount || 0);
  const outstanding = Math.max(invoice - received, 0);
  const progress = invoice > 0 ? Math.round((received / invoice) * 100) : 0;

  async function saveBatch(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put(`${API_BASE}/portal/batches/${batch.id}`, {
        ...form,
        invoice_amount: Number(form.invoice_amount || 0),
        received_amount: Number(form.received_amount || 0),
      });

      setEditing(false);
      if (onSaved) await onSaved();
    } catch (err) {
      console.error("Update batch failed:", err);
      alert("Update batch failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="flex items-start justify-between p-6">
        <div>
          <div className="text-2xl font-bold">{batch.batch_no || "-"}</div>
          <div className="text-gray-500 mt-1">
            {batch.customer_name || "-"} · {batch.status || "draft"}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">Outstanding</div>
          <div className="text-2xl font-bold">
            ${outstanding.toFixed(2)}
          </div>

          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
            className="mt-3 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
          >
            {editing ? "Cancel" : "Edit Batch"}
          </button>
        </div>
      </div>

      {editing && (
        <form onSubmit={saveBatch} className="border-t bg-gray-50 p-5">
          <div className="grid grid-cols-3 gap-4">
            <input
              value={form.batch_no}
              onChange={(e) =>
                setForm({ ...form, batch_no: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Batch No"
            />

            <input
              value={form.customer_name}
              onChange={(e) =>
                setForm({ ...form, customer_name: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Customer"
            />

            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="shipped">Shipped</option>
              <option value="closed">Closed</option>
            </select>

            <input
              type="number"
              step="0.01"
              value={form.invoice_amount}
              onChange={(e) =>
                setForm({ ...form, invoice_amount: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Invoice Amount"
            />

            <input
              type="number"
              step="0.01"
              value={form.received_amount}
              onChange={(e) =>
                setForm({ ...form, received_amount: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Received Amount"
            />

            <input
              type="date"
              value={form.shipment_date}
              onChange={(e) =>
                setForm({ ...form, shipment_date: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Batch"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-4 gap-4 px-6 pb-6">
        <div className="rounded-2xl bg-gray-50 p-5">
          <div className="text-sm text-gray-500">Invoice</div>
          <div className="font-semibold mt-2">${invoice.toFixed(2)}</div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-5">
          <div className="text-sm text-gray-500">Received</div>
          <div className="font-semibold mt-2">${received.toFixed(2)}</div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-5">
          <div className="text-sm text-gray-500">Progress</div>
          <div className="font-semibold mt-2">{progress}%</div>
        </div>

        <div className="rounded-2xl bg-gray-50 p-5">
          <div className="text-sm text-gray-500">Shipment Date</div>
          <div className="font-semibold mt-2">
            {batch.shipment_date ? String(batch.shipment_date).slice(0, 10) : "-"}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-gray-900"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}