import {
  DataSection,
  DataTable,
} from "../portal/common";

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : "-";
}

export default function DealerShipmentTable({ shipments = [] }) {
  const columns = [
  {
    key: "shipment_no",
    label: "Shipment No",
  },
  {
    key: "batch_no",
    label: "Batch No",
  },
  {
    key: "carrier",
    label: "Carrier",
    render: (row) => row.carrier || "-",
  },
  {
    key: "tracking_no",
    label: "Tracking No",
    render: (row) => row.tracking_no || "-",
  },
  {
    key: "status",
    label: "Status",
    render: (row) => row.status || "-",
  },
  {
    key: "eta",
    label: "ETA",
    render: (row) => dateOnly(row.eta),
  },
];

  return (
    <DataSection
      title="Recent Shipments"
      description="Recent shipment records visible to this dealer."
    >
      <DataTable
        columns={columns}
        rows={shipments}
        emptyText="No recent shipments."
      />
    </DataSection>
  );
}