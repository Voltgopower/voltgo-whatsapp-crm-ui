export default function BatchItemsTable({ items = [] }) {
  const totalQty = items.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0
  );

  const shipmentCount = new Set(
    items
      .map((item) => item.shipment_id || item.shipment_no)
      .filter(Boolean)
  ).size;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <div className="font-semibold">Product Summary</div>
          <div className="text-sm text-gray-500 mt-1">
            Products included in this batch, summarized from shipment line items.
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-5">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Products</div>
            <div className="text-3xl font-bold mt-2">{items.length}</div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Shipments</div>
            <div className="text-3xl font-bold mt-2">{shipmentCount}</div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Total Qty</div>
            <div className="text-3xl font-bold mt-2">{totalQty}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b font-semibold">
          Products in This Batch
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-5 py-3">SKU</th>
              <th className="text-left px-5 py-3">Product</th>
              <th className="text-right px-5 py-3">Total Qty</th>
              <th className="text-right px-5 py-3">Shipment Count</th>
              <th className="text-left px-5 py-3">Latest Shipment</th>
            </tr>
          </thead>

          <tbody>
            {items.length > 0 ? (
              items.map((item) => {
                const qty = Number(item.qty || 0);
                const shipmentNo =
                  item.shipment_no || item.latest_shipment_no || "-";

                return (
                  <tr key={item.id || item.sku} className="border-t">
                    <td className="px-5 py-3 font-medium">
                      {item.sku || "-"}
                    </td>

                    <td className="px-5 py-3">
                      {item.description || item.name || "-"}
                    </td>

                    <td className="px-5 py-3 text-right">{qty}</td>

                    <td className="px-5 py-3 text-right">
                      {item.shipment_count || "-"}
                    </td>

                    <td className="px-5 py-3">{shipmentNo}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="px-5 py-8 text-center text-gray-500"
                  colSpan={5}
                >
                  No products linked to shipments in this batch yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}