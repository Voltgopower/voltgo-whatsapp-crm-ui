import { SummaryCard } from "../../components/portal/common";

export default function BatchPaymentSummary({ batch }) {
  const invoice = Number(batch.invoice_amount || 0);
  const received = Number(batch.received_amount || 0);
  const balance = Number(batch.balance || 0);
  const payments = batch.payments || [];

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

      {/* Card Header */}

      <div className="px-5 py-4 border-b">
        <div className="font-semibold">
          Payment Summary
        </div>
      </div>

      {/* Summary */}

      <div className="grid grid-cols-4 gap-4 p-5">

        <SummaryCard
          label="Invoice Amount"
          value={`$${invoice.toFixed(2)}`}
        />

        <SummaryCard
          label="Received"
          value={`$${received.toFixed(2)}`}
        />

        <SummaryCard
          label="Outstanding"
          value={`$${balance.toFixed(2)}`}
        />

        <SummaryCard
          label="Payments"
          value={payments.length}
        />

      </div>

      {/* Payments */}

      <table className="w-full text-sm">

        <thead className="bg-gray-50 text-gray-500 border-t">

          <tr>

            <th className="text-left px-5 py-3">
              Method
            </th>

            <th className="text-left px-5 py-3">
              Reference
            </th>

            <th className="text-right px-5 py-3">
              Allocated
            </th>

          </tr>

        </thead>

        <tbody>

          {payments.length > 0 ? (

            payments.map((p) => (

              <tr
                key={p.id}
                className="border-t"
              >

                <td className="px-5 py-3">
                  {p.method || "-"}
                </td>

                <td className="px-5 py-3">
                  {p.reference_no || "-"}
                </td>

                <td className="px-5 py-3 text-right">
                  ${Number(
                    p.allocated_amount || 0
                  ).toFixed(2)}
                </td>

              </tr>

            ))

          ) : (

            <tr>

              <td
                colSpan={3}
                className="px-5 py-8 text-center text-gray-500"
              >

                No payment records.

              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>
  );
}