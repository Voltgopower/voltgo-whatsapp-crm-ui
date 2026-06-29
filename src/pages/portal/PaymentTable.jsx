import React, { useState } from "react";
import DocumentPage from "./DocumentPage";

export default function PaymentTable({ payments = [] }) {
  const [openAllocationId, setOpenAllocationId] = useState(null);

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 border-b">
        <div className="font-semibold">Payments</div>
      </div>

      {/* Payment Evidence Table */}
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="text-left px-5 py-3">Method</th>
            <th className="text-left px-5 py-3">Reference</th>
            <th className="text-right px-5 py-3">Allocated</th>
            <th className="text-left px-5 py-3">Evidence</th>
            <th className="text-left px-5 py-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {payments.length > 0 ? (
            payments.map((p) => {
              const isOpen = openAllocationId === p.id;
              const allocatedAmount = Number(p.allocated_amount || 0);

              return (
                <React.Fragment key={p.id}>
                  <tr className="border-t">
                    <td className="px-5 py-3">{p.method || "-"}</td>
                    <td className="px-5 py-3">{p.reference_no || "-"}</td>
                    <td className="px-5 py-3 text-right">
                      ${allocatedAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                        Evidence
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenAllocationId(isOpen ? null : p.id)
                        }
                        className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                      >
                        {isOpen ? "Close" : "Evidence"}
                      </button>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr>
                      <td colSpan={5} className="px-5 py-4 bg-gray-50">
                        <div className="rounded-xl border bg-white p-5">
                          <div className="text-lg font-semibold mb-4">
                            Payment Evidence
                          </div>

                          <DocumentPage
                            relatedType="allocation"
                            relatedId={p.id}
                            compact
                          />
                        </div>
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
                colSpan={5}
              >
                No payments.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}