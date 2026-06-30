const secondaryButtonClass =
  "px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm";

function formatStatus(status) {
  if (!status) return "-";
  return status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ShipmentCard({
  shipment,
  isOpen,
  linkedAmount,
  onToggle,
  children,
}) {
  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div>
          <div className="font-semibold">
            Shipment #{shipment.shipment_no || "-"}
          </div>

          <div className="text-sm text-gray-500 mt-1">
            {shipment.carrier || "-"} · {formatStatus(shipment.status)} ·
            Tracking: {shipment.tracking_no || "-"}
          </div>

          <div className="text-xs text-gray-400 mt-1">
            B/L: {shipment.bol_no || "-"} · Container:{" "}
            {shipment.container_no || "-"} · Linked: ${linkedAmount}
          </div>
        </div>

        <button type="button" onClick={onToggle} className={secondaryButtonClass}>
          {isOpen ? "Collapse" : "Expand"}
        </button>
      </div>

      {isOpen && children}
    </div>
  );
}