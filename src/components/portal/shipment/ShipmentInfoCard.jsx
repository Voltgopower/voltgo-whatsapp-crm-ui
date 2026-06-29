export default function ShipmentInfoCard({ shipment }) {
  return (
    <div className="bg-white rounded-xl border p-5">

      <div className="font-semibold mb-4">
        Shipment Information
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">

        <div>
          <div className="text-gray-500">Shipment No</div>
          <div>{shipment.shipment_no || "-"}</div>
        </div>

        <div>
          <div className="text-gray-500">Status</div>
          <div>{shipment.status || "-"}</div>
        </div>

        <div>
          <div className="text-gray-500">Carrier</div>
          <div>{shipment.carrier || "-"}</div>
        </div>

        <div>
          <div className="text-gray-500">Tracking No</div>
          <div>{shipment.tracking_no || "-"}</div>
        </div>

        <div>
          <div className="text-gray-500">B/L No</div>
          <div>{shipment.bol_no || "-"}</div>
        </div>

        <div>
          <div className="text-gray-500">Container No</div>
          <div>{shipment.container_no || "-"}</div>
        </div>

      </div>

    </div>
  );
}