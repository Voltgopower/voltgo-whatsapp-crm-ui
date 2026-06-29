import {
  EntityHeader,
  SummaryCard,
} from "../portal/common";

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function DealerSummary({ summary }) {
  if (!summary) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <EntityHeader
        title={summary.dealer_company || "-"}
        subtitle={`${summary.dealer_code || "-"} · ${summary.email || "-"}`}
        rightLabel="Outstanding"
        rightValue={money(summary.outstanding_amount)}
      />

      <div className="grid grid-cols-4 gap-4 mt-6">
        <SummaryCard
          label="Customers"
          value={summary.customer_count || 0}
        />

        <SummaryCard
          label="Batches"
          value={summary.batch_count || 0}
        />

        <SummaryCard
          label="Shipments"
          value={summary.shipment_count || 0}
        />

        <SummaryCard
          label="Received"
          value={money(summary.received_amount)}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <SummaryCard
          label="Invoice Amount"
          value={money(summary.invoice_amount)}
        />

        <SummaryCard
          label="Received Amount"
          value={money(summary.received_amount)}
        />

        <SummaryCard
          label="Outstanding Amount"
          value={money(summary.outstanding_amount)}
        />
      </div>
    </div>
  );
}