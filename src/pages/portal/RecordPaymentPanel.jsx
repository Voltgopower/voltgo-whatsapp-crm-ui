import React, { useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://voltgo-whatsapp-support-production.up.railway.app/api";

export default function RecordPaymentPanel({ batch, onSaved }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    payment_date: "",
    amount: "",
    method: "wire",
    reference_no: "",
    notes: "",
  });

  async function savePayment(e) {
    e.preventDefault();

    if (!form.amount) {
      alert("Amount is required");
      return;
    }

    setSaving(true);

    try {
      const paymentRes = await axios.post(`${API_BASE}/portal/payments`, {
        customer_id: batch.customer_id || batch.customer?.id || 1,
        payment_date: form.payment_date || null,
        amount: Number(form.amount || 0),
        method: form.method,
        reference_no: form.reference_no,
        notes: form.notes,
      });

      await axios.post(`${API_BASE}/portal/allocations`, {
        payment_id: paymentRes.data.id,
        batch_id: batch.id,
        allocated_amount: Number(form.amount || 0),
      });

      setForm({
        payment_date: "",
        amount: "",
        method: "wire",
        reference_no: "",
        notes: "",
      });

      setShowForm(false);
      onSaved?.();
    } catch (err) {
      console.error("Record payment failed:", err);
      alert("Record payment failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="font-semibold">Record Payment</div>

        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
        >
          {showForm ? "Cancel" : "+ Record Payment"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={savePayment} className="p-5 bg-gray-50">
          <div className="grid grid-cols-4 gap-4">
            <input
              type="date"
              value={form.payment_date}
              onChange={(e) =>
                setForm({ ...form, payment_date: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm"
            />

            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Amount"
            />

            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="wire">Wire</option>
              <option value="ach">ACH</option>
              <option value="check">Check</option>
              <option value="credit_card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>

            <input
              value={form.reference_no}
              onChange={(e) =>
                setForm({ ...form, reference_no: e.target.value })
              }
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Reference"
            />
          </div>

          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-4"
            placeholder="Notes"
          />

          <button
            type="submit"
            disabled={saving}
            className="mt-4 px-5 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </form>
      )}
    </div>
  );
}