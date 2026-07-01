import React, { useState } from "react";
import axios from "axios";
import DocumentPage from "./DocumentPage";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const inputClass = "border rounded-lg px-3 py-2 text-sm";
const secondaryButtonClass =
  "px-3 py-1 rounded-lg border bg-white hover:bg-gray-50 text-sm";
const dangerButtonClass =
  "px-3 py-1 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 text-sm";
const primaryButtonClass =
  "px-5 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50";

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getPaymentStatus(amount, allocated) {
  const paymentAmount = Number(amount || 0);
  const allocatedAmount = Number(allocated || 0);

  if (paymentAmount <= 0) return "Draft";
  if (allocatedAmount <= 0) return "Unallocated";
  if (allocatedAmount < paymentAmount) return "Partial";
  return "Allocated";
}

function getStatusClass(status) {
  if (status === "Allocated") return "bg-green-50 text-green-700";
  if (status === "Partial") return "bg-yellow-50 text-yellow-700";
  if (status === "Unallocated") return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-600";
}

export default function PaymentTable({ payments = [], onUpdated }) {
  const [openPaymentId, setOpenPaymentId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customer_id: "",
    payment_date: "",
    amount: "",
    method: "",
    reference_no: "",
    notes: "",
  });

  const totalAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.payment_amount || payment.amount || 0),
    0
  );

  const totalAllocated = payments.reduce(
    (sum, payment) => sum + Number(payment.allocated_amount || 0),
    0
  );

  const totalBalance = Math.max(totalAmount - totalAllocated, 0);

  function startEdit(payment) {
    setEditingPaymentId(payment.id);

    setForm({
      customer_id: payment.customer_id || "",
      payment_date: payment.payment_date
        ? String(payment.payment_date).slice(0, 10)
        : "",
      amount: payment.payment_amount || payment.amount || "",
      method: payment.method || "",
      reference_no: payment.reference_no || "",
      notes: payment.payment_notes || payment.notes || "",
    });
  }

  function cancelEdit() {
    setEditingPaymentId(null);
    setForm({
      customer_id: "",
      payment_date: "",
      amount: "",
      method: "",
      reference_no: "",
      notes: "",
    });
  }

  async function savePayment(paymentId) {
    setSaving(true);

    try {
      await axios.put(`${API_BASE}/portal/payments/${paymentId}`, {
        customer_id: form.customer_id || null,
        payment_date: form.payment_date || null,
        amount: Number(form.amount || 0),
        method: form.method || null,
        reference_no: form.reference_no || null,
        notes: form.notes || null,
      });

      cancelEdit();

      if (onUpdated) {
        await onUpdated();
      }
    } catch (err) {
      console.error("Update payment failed:", err);
      alert(err.response?.data?.error || "Update payment failed");
    } finally {
      setSaving(false);
    }
  }

  async function deletePayment(payment) {
    const amount = Number(payment.payment_amount || payment.amount || 0);
    const allocated = Number(payment.allocated_amount || 0);

    if (allocated > 0) {
      alert("This payment has allocations. Please unlink allocations before deleting it.");
      return;
    }

    if (
      !window.confirm(
        `Delete payment ${payment.reference_no || payment.id} (${formatMoney(
          amount
        )})?`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/portal/payments/${payment.id}`);

      if (onUpdated) {
        await onUpdated();
      }
    } catch (err) {
      console.error("Delete payment failed:", err);
      alert(err.response?.data?.error || "Delete payment failed");
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <div className="font-semibold">Payment Summary</div>
          <div className="text-sm text-gray-500 mt-1">
            Payment records and allocation status for this batch.
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 p-5">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Payments</div>
            <div className="text-3xl font-bold mt-2">{payments.length}</div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Payment Amount</div>
            <div className="text-3xl font-bold mt-2">
              {formatMoney(totalAmount)}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Allocated</div>
            <div className="text-3xl font-bold mt-2">
              {formatMoney(totalAllocated)}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Unallocated</div>
            <div className="text-3xl font-bold mt-2">
              {formatMoney(totalBalance)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <div className="font-semibold">Payments</div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3">Method</th>
              <th className="text-left px-5 py-3">Reference</th>
              <th className="text-right px-5 py-3">Amount</th>
              <th className="text-right px-5 py-3">Allocated</th>
              <th className="text-right px-5 py-3">Balance</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {payments.length > 0 ? (
              payments.map((payment) => {
                const isOpen = openPaymentId === payment.id;
                const isEditing = editingPaymentId === payment.id;

                const amount = Number(
                  payment.payment_amount || payment.amount || 0
                );
                const allocated = Number(payment.allocated_amount || 0);
                const balance = Math.max(amount - allocated, 0);
                const status = getPaymentStatus(amount, allocated);

                return (
                  <React.Fragment key={payment.id}>
                    <tr className="border-t">
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <input
                            type="date"
                            value={form.payment_date}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                payment_date: e.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        ) : (
                          formatDate(payment.payment_date)
                        )}
                      </td>

                      <td className="px-5 py-3">
                        {isEditing ? (
                          <input
                            value={form.method}
                            onChange={(e) =>
                              setForm({ ...form, method: e.target.value })
                            }
                            className={inputClass}
                            placeholder="Method"
                          />
                        ) : (
                          payment.method || "-"
                        )}
                      </td>

                      <td className="px-5 py-3">
                        {isEditing ? (
                          <input
                            value={form.reference_no}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                reference_no: e.target.value,
                              })
                            }
                            className={inputClass}
                            placeholder="Reference"
                          />
                        ) : (
                          payment.reference_no || "-"
                        )}
                      </td>

                      <td className="px-5 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={form.amount}
                            onChange={(e) =>
                              setForm({ ...form, amount: e.target.value })
                            }
                            className={`${inputClass} w-32 text-right`}
                            placeholder="Amount"
                          />
                        ) : (
                          formatMoney(amount)
                        )}
                      </td>

                      <td className="px-5 py-3 text-right">
                        {formatMoney(allocated)}
                      </td>

                      <td className="px-5 py-3 text-right">
                        {formatMoney(balance)}
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs ${getStatusClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => savePayment(payment.id)}
                              disabled={saving}
                              className={primaryButtonClass}
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>

                            <button
                              type="button"
                              onClick={cancelEdit}
                              className={secondaryButtonClass}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenPaymentId(isOpen ? null : payment.id)
                              }
                              className={secondaryButtonClass}
                            >
                              Evidence
                            </button>

                            <button
                              type="button"
                              onClick={() => startEdit(payment)}
                              className={secondaryButtonClass}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => deletePayment(payment)}
                              className={dangerButtonClass}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {isEditing && (
                      <tr>
                        <td colSpan={8} className="px-5 pb-4 bg-gray-50">
                          <textarea
                            value={form.notes}
                            onChange={(e) =>
                              setForm({ ...form, notes: e.target.value })
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm mt-4"
                            placeholder="Notes"
                            rows={3}
                          />
                        </td>
                      </tr>
                    )}

                    {isOpen && !isEditing && (
                      <tr>
                        <td colSpan={8} className="px-5 py-4 bg-gray-50">
                          <DocumentPage
                            relatedType="payment"
                            relatedId={payment.id}
                            compact
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  className="px-5 py-8 text-center text-gray-500"
                  colSpan={8}
                >
                  No payments.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}