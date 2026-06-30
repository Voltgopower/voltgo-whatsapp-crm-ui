import { SummaryCard } from "../../components/portal/common";

export default function BatchPaymentSummary({ batch }) {
  const invoice = Number(batch.invoice_amount || 0);
  const received = Number(batch.received_amount || 0);
  const balance = Math.max(invoice - received, 0);
  const payments = batch.payments || [];

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <div className="font-semibold">Payment Summary</div>
      </div>

      <div className="grid grid-cols-4 gap-4 p-5">
        <SummaryCard label="Invoice Amount" value={`$${invoice.toFixed(2)}`} />
        <SummaryCard label="Received" value={`$${received.toFixed(2)}`} />
        <SummaryCard label="Outstanding" value={`$${balance.toFixed(2)}`} />
        <SummaryCard label="Payments" value={payments.length} />
      </div>
    </div>
  );
}