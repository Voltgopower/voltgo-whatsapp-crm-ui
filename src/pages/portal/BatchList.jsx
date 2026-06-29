export default function BatchList({ batches, onSelectBatch }) {
  return (
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
              onClick={() => onSelectBatch(b.id)}
              className="border-t hover:bg-blue-50 cursor-pointer"
            >
              <td className="px-5 py-3 font-medium">{b.batch_no}</td>
              <td className="px-5 py-3">
                  {b.dealer_name || b.customer_name || "-"}
              </td>
              <td className="px-5 py-3 text-right">${b.invoice_amount}</td>
              <td className="px-5 py-3 text-right">${b.received_amount}</td>
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
  );
}