export default function ShipmentAllocation({
  shipment,
  allocations,
  availableOptions,
  allocationForm,
  setAllocationForm,
  showAllocationForm,
  setShowAllocationForm,
  linkAllocation,
  unlinkAllocation,
}) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="font-semibold">Linked Payment</div>

        <button
          type="button"
          onClick={() =>
            setShowAllocationForm({
              ...showAllocationForm,
              [shipment.id]: !showAllocationForm[shipment.id],
            })
          }
          className="px-3 py-1 text-sm border rounded-lg bg-white hover:bg-gray-50"
        >
          {showAllocationForm[shipment.id] ? "Cancel" : "+ Link Allocation"}
        </button>
      </div>

      {showAllocationForm[shipment.id] && (
        <div className="flex items-end gap-3 p-4 border-b bg-gray-50">
          <select
            value={allocationForm.allocation_id}
            onChange={(e) =>
              setAllocationForm({
                ...allocationForm,
                allocation_id: e.target.value,
              })
            }
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select Allocation</option>
            {availableOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.method || "-"} · {a.reference_no || "-"} · $
                {a.allocated_amount}
              </option>
            ))}
          </select>

          <input
            value={allocationForm.allocated_amount}
            onChange={(e) =>
              setAllocationForm({
                ...allocationForm,
                allocated_amount: e.target.value,
              })
            }
            className="w-40 border rounded-lg px-3 py-2 text-sm"
            placeholder="Amount"
          />

          <button
            type="button"
            onClick={() => linkAllocation(shipment.id)}
            className="px-6 py-2 rounded-lg bg-gray-900 text-white text-sm whitespace-nowrap"
          >
            Link
          </button>
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="text-left px-4 py-3">Method</th>
            <th className="text-left px-4 py-3">Reference</th>
            <th className="text-right px-4 py-3">Amount</th>
            <th className="text-left px-4 py-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {allocations.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="px-4 py-3">{a.method || "-"}</td>
              <td className="px-4 py-3">{a.reference_no || "-"}</td>
              <td className="px-4 py-3 text-right">
                ${Number(a.allocated_amount || 0).toFixed(2)}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => unlinkAllocation(shipment.id, a.id)}
                  className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                >
                  Unlink
                </button>
              </td>
            </tr>
          ))}

          {allocations.length === 0 && (
            <tr>
              <td className="px-4 py-5 text-gray-500" colSpan={4}>
                No linked payments.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}