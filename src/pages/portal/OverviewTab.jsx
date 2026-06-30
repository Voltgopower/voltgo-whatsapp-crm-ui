export default function OverviewTab({ batch }) {
  const shipments = batch.shipments || [];
  const payments = batch.payments || [];
  const items = batch.items || [];
  const documents = batch.documents || [];

  const cards = [
    {
      label: "Shipment Records",
      value: shipments.length,
      description: "Shipment records linked to this batch.",
    },
    {
      label: "Payment Records",
      value: payments.length,
      description: "Payment allocations recorded for this batch.",
    },
    {
      label: "Product Items",
      value: items.length,
      description: "Product line items included in this batch.",
    },
    {
      label: "Document Files",
      value: documents.length,
      description: "Batch-level documents uploaded.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="text-3xl font-bold mt-2">{card.value}</div>
            <div className="text-sm text-gray-500 mt-2">
              {card.description}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <div className="font-semibold mb-2">Recent Activity</div>
        <div className="text-sm text-gray-500">
          No recent activity yet.
        </div>
      </div>
    </div>
  );
}