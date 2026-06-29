import BatchFinancialSummary from "./BatchFinancialSummary";
import BatchItemsTable from "./BatchItemsTable";
import BatchPaymentSummary from "./BatchPaymentSummary";
import PaymentTable from "./PaymentTable";
import ShipmentPanel from "./ShipmentPanel";

export default function BatchDetail({ batch, onBack }) {
  if (!batch) return null;

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
        >
          ← Back to Batches
        </button>
      </div>

      <BatchFinancialSummary batch={batch} />

      <ShipmentPanel batchId={batch.id} />

      <BatchPaymentSummary batch={batch} />

      <BatchItemsTable items={batch.items || []} />

      <PaymentTable payments={batch.payments || []} />
    </div>
  );
}