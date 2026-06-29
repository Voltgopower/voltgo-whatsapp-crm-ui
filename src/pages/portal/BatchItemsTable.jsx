import {
  DataSection,
  DataTable,
} from "../../components/portal/common";

export default function BatchItemsTable({ items = [] }) {
  const columns = [
    {
      key: "sku",
      label: "SKU",
    },
    {
      key: "description",
      label: "Description",
    },
    {
      key: "qty",
      label: "Qty",
      align: "right",
      render: (item) => Number(item.qty || 0),
    },
    {
      key: "unit_price",
      label: "Unit Price",
      align: "right",
      render: (item) => `$${Number(item.unit_price || 0).toFixed(2)}`,
    },
  ];

  return (
    <DataSection title="Items">
      <DataTable
        columns={columns}
        rows={items}
        emptyText="No items."
      />
    </DataSection>
  );
}