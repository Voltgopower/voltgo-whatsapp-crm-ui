import React, { useEffect, useState } from "react";
import axios from "axios";
import PortalSidebar from "./PortalSidebar";
import DocumentPage from "./DocumentPage";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export default function PortalPage() {
  const [tab, setTab] = useState("batches");
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadBatches() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/portal/batches`);
      setBatches(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  }

  async function loadBatchDetail(id) {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/portal/batches/${id}`);
      setSelectedBatch(res.data);
      setTab("batchDetail");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  return (
    <div className="h-full bg-gray-100 text-gray-900 flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">Voltgo Portal</div>
          <div className="text-sm text-gray-500">
            Batch, payment, document, and dealer statement center
          </div>
        </div>

        <button
          onClick={loadBatches}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 min-h-0 flex">
        <PortalSidebar tab={tab} setTab={setTab} />

        <div className="flex-1 overflow-auto p-6">
          {loading ? <div className="text-gray-500 mb-4">Loading...</div> : null}

          {tab === "documents" && <DocumentPage />}

          {tab === "batches" && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="px-5 py-4 border-b font-semibold">Batch List</div>

              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-5 py-3">Batch No</th>
                    <th className="text-left px-5 py-3">Customer</th>
                    <th className="text-right px-5 py-3">Invoice</th>
                    <th className="text-right px-5 py-3">Received</th>
                    <th className="text-right px-5 py-3">Balance</th>
                    <th className="text-left px-5 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {batches.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => loadBatchDetail(b.id)}
                      className="border-t hover:bg-blue-50 cursor-pointer"
                    >
                      <td className="px-5 py-3 font-medium">{b.batch_no}</td>
                      <td className="px-5 py-3">{b.customer_name}</td>
                      <td className="px-5 py-3 text-right">
                        ${b.invoice_amount}
                      </td>
                      <td className="px-5 py-3 text-right">
                        ${b.received_amount}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">
                        ${b.balance}
                      </td>
                      <td className="px-5 py-3">{b.status}</td>
                    </tr>
                  ))}

                  {batches.length === 0 && (
                    <tr>
                      <td className="px-5 py-6 text-gray-500" colSpan="6">
                        No batches yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === "batchDetail" && selectedBatch && (
            <div className="space-y-5">
              <button
                onClick={() => setTab("batches")}
                className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
              >
                ← Back to Batches
              </button>

              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {selectedBatch.batch_no}
                    </div>
                    <div className="text-gray-500 mt-1">
                      {selectedBatch.customer?.name} · {selectedBatch.status}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500">Balance</div>
                    <div className="text-2xl font-bold">
                      ${selectedBatch.balance}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="text-sm text-gray-500">Invoice</div>
                    <div className="text-xl font-semibold">
                      ${selectedBatch.invoice_amount}
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="text-sm text-gray-500">Received</div>
                    <div className="text-xl font-semibold">
                      ${selectedBatch.received_amount}
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="text-sm text-gray-500">Shipment Date</div>
                    <div className="text-xl font-semibold">
                      {selectedBatch.shipment_date
                        ? selectedBatch.shipment_date.slice(0, 10)
                        : "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b font-semibold">Items</div>

                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left px-5 py-3">SKU</th>
                      <th className="text-left px-5 py-3">Description</th>
                      <th className="text-right px-5 py-3">Qty</th>
                      <th className="text-right px-5 py-3">Unit Price</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedBatch.items?.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-5 py-3">{item.sku}</td>
                        <td className="px-5 py-3">{item.description}</td>
                        <td className="px-5 py-3 text-right">{item.qty}</td>
                        <td className="px-5 py-3 text-right">
                          ${item.unit_price}
                        </td>
                      </tr>
                    ))}

                    {(!selectedBatch.items ||
                      selectedBatch.items.length === 0) && (
                      <tr>
                        <td className="px-5 py-6 text-gray-500" colSpan="4">
                          No items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b font-semibold">Payments</div>

                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left px-5 py-3">Method</th>
                      <th className="text-left px-5 py-3">Reference</th>
                      <th className="text-right px-5 py-3">Allocated</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedBatch.payments?.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-5 py-3">{p.method}</td>
                        <td className="px-5 py-3">{p.reference_no}</td>
                        <td className="px-5 py-3 text-right">
                          ${p.allocated_amount}
                        </td>
                      </tr>
                    ))}

                    {(!selectedBatch.payments ||
                      selectedBatch.payments.length === 0) && (
                      <tr>
                        <td className="px-5 py-6 text-gray-500" colSpan="3">
                          No payments.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}