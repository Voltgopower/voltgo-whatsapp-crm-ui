import {
  EntityHeader,
  SummaryCard,
} from "../../components/portal/common";

export default function BatchFinancialSummary({ batch }) {
  const invoice = Number(batch.invoice_amount || 0);
  const received = Number(batch.received_amount || 0);
  const balance = Number(batch.balance || 0);

  const progress =
    invoice > 0
      ? Math.min(100, Math.round((received / invoice) * 100))
      : 0;

  const shipmentDate = batch.shipment_date
    ? batch.shipment_date.slice(0, 10)
    : "-";

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <EntityHeader
        title={batch.batch_no}
        subtitle={`${batch.customer?.name || "-"} · ${batch.status || "-"}`}
        rightLabel="Outstanding"
        rightValue={`$${balance.toFixed(2)}`}
      />

      <div className="grid grid-cols-4 gap-4 mt-6">
        <SummaryCard
          label="Invoice"
          value={`$${invoice.toFixed(2)}`}
        />

        <SummaryCard
          label="Received"
          value={`$${received.toFixed(2)}`}
        />

        <SummaryCard
          label="Progress"
          value={`${progress}%`}
        />

        <SummaryCard
          label="Shipment Date"
          value={shipmentDate}
        />
      </div>

      <div className="mt-5">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}