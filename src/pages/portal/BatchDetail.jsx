import { useState } from "react";

import BatchFinancialSummary from "./BatchFinancialSummary";
import BatchItemsTable from "./BatchItemsTable";
import BatchPaymentSummary from "./BatchPaymentSummary";
import PaymentTable from "./PaymentTable";
import ShipmentPanel from "./ShipmentPanel";
import DocumentPage from "./DocumentPage";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "shipments", label: "Shipments" },
  { key: "payments", label: "Payments" },
  { key: "items", label: "Items" },
  { key: "documents", label: "Documents" },
];

export default function BatchDetail({ batch, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!batch) return null;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
      >
        ← Back to Batches
      </button>

      <BatchFinancialSummary batch={batch} />

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex border-b bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm border-r ${
                activeTab === tab.key
                  ? "bg-white font-semibold text-gray-900"
                  : "text-gray-500 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <BatchPaymentSummary batch={batch} />
            </div>
          )}

          {activeTab === "shipments" && (
            <ShipmentPanel batchId={batch.id} />
          )}

          {activeTab === "payments" && (
            <div className="space-y-5">
              <BatchPaymentSummary batch={batch} />
              <PaymentTable payments={batch.payments || []} />
            </div>
          )}

          {activeTab === "items" && (
            <BatchItemsTable items={batch.items || []} />
          )}

          {activeTab === "documents" && (
            <DocumentPage
              relatedType="batch"
              relatedId={batch.id}
              compact
            />
          )}
        </div>
      </div>
    </div>
  );
}