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

export default function DealerPaymentTable({ payments = [] }) {
  const columns = [
  {
    key: "payment_date",
    label: "Payment Date",
    render: (row) => dateOnly(row.payment_date),
  },
  {
    key: "method",
    label: "Method",
    render: (row) => row.method || "-",
  },
  {
    key: "reference_no",
    label: "Reference",
    render: (row) => row.reference_no || "-",
  },
  {
    key: "amount",
    label: "Amount",
    align: "right",
    render: (row) => money(row.amount),
  },
];

  return (
    <DataSection
      title="Recent Payments"
      description="Latest payment records for this dealer."
    >
      <DataTable
        columns={columns}
        rows={payments}
        emptyText="No recent payments."
      />
    </DataSection>
  );
}