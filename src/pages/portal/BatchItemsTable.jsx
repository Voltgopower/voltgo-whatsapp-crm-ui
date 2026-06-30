import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export default function BatchItemsTable({ batchId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadProductSummary() {
    if (!batchId) return;

    setLoading(true);

    try {
      const res = await axios.get(
        `${API_BASE}/portal/batches/${batchId}/product-summary`
      );

      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Load batch product summary failed:", err);
      alert("Failed to load product summary");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProductSummary();
  }, [batchId]);

  const totalProducts = items.length;

  const totalQty = items.reduce(
    (sum, item) => sum + Number(item.total_qty || 0),
    0
  );

  const shipmentCount = new Set(
    items
      .map((item) => item.latest_shipment_no)
      .filter(Boolean)
  ).size;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <div className="font-semibold">Product Summary</div>
          <div className="text-sm text-gray-500 mt-1">
            Products summarized from shipment products in this batch.
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-5">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Products</div>
            <div className="text-3xl font-bold mt-2">{totalProducts}</div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Total Qty</div>
            <div className="text-3xl font-bold mt-2">{totalQty}</div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Shipment Groups</div>
            <div className="text-3xl font-bold mt-2">{shipmentCount}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="font-semibold">Products in This Batch</div>

          <button
            type="button"
            onClick={loadProductSummary}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="px-5 py-4 text-sm text-gray-500">
            Loading product summary...
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-5 py-3">SKU</th>
              <th className="text-left px-5 py-3">Product</th>
              <th className="text-right px-5 py-3">Total Qty</th>
              <th className="text-right px-5 py-3">Shipment Count</th>
              <th className="text-right px-5 py-3">Amount</th>
              <th className="text-left px-5 py-3">Latest Shipment</th>
            </tr>
          </thead>

          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.product_id || item.sku} className="border-t">
                  <td className="px-5 py-3 font-medium">
                    {item.sku || "-"}
                  </td>

                  <td className="px-5 py-3">
                    {item.product_name || "-"}
                  </td>

                  <td className="px-5 py-3 text-right">
                    {Number(item.total_qty || 0)}
                  </td>

                  <td className="px-5 py-3 text-right">
                    {Number(item.shipment_count || 0)}
                  </td>

                  <td className="px-5 py-3 text-right font-medium">
                    ${Number(item.amount || 0).toFixed(2)}
                  </td>

                  <td className="px-5 py-3">
                    {item.latest_shipment_no || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-5 py-8 text-center text-gray-500"
                  colSpan={6}
                >
                  No shipment products linked to this batch yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}