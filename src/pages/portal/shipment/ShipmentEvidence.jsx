import DocumentPage from "../DocumentPage";

export default function ShipmentEvidence({ shipment }) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b font-semibold">
        Shipment Documents
      </div>

      <div className="p-4">
        <DocumentPage
          relatedType="shipment"
          relatedId={shipment.id}
          compact
        />
      </div>
    </div>
  );
}