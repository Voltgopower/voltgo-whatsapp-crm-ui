import {
  DataSection,
  DataTable,
} from "../portal/common";

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : "-";
}

export default function DealerBatchTable({ batches = [] }) {
  const columns = [
  {
    key: "batch_no",
    label: "Batch No",
  },
  {
    key: "status",
    label: "Status",
    render: (row) => row.status || "-",
  },
  {
    key: "shipment_date",
    label: "Shipment Date",
    render: (row) => dateOnly(row.shipment_date),
  },
  {
    key: "invoice_amount",
    label: "Invoice Amount",
    align: "right",
    render: (row) => money(row.invoice_amount),
  },
];

  return (
    <DataSection
      title="Recent Batches"
      description="Recent batches associated with this dealer."
    >
      <DataTable
        columns={columns}
        rows={batches}
        emptyText="No recent batches."
      />
    </DataSection>
  );
}