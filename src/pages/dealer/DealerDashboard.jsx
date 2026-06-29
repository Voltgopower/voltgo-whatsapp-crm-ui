import { useEffect, useState } from "react";

import { PageHeader } from "../../components/portal/common";
import DealerSummary from "../../components/dealer/DealerSummary";
import DealerBatchTable from "../../components/dealer/DealerBatchTable";
import DealerShipmentTable from "../../components/dealer/DealerShipmentTable";
import DealerPaymentTable from "../../components/dealer/DealerPaymentTable";

import { getDealerDashboard } from "../../services/dealerApi";

const TEST_DEALER_ID = 1;

export default function DealerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadDashboard() {
    setLoading(true);

    try {
      const data = await getDealerDashboard(TEST_DEALER_ID);
      setDashboard(data);
    } catch (err) {
console.error("Dealer dashboard error:", {
  status: err?.response?.status,
  url: err?.config?.url,
  data: err?.response?.data,
});
      console.error("Load dealer dashboard failed:", err);
      alert("Failed to load dealer dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="p-6 space-y-5">
        <PageHeader
          title="Dealer Dashboard"
          description="View dealer account status, recent batches, shipments, and payments."
          right={
            <button
              type="button"
              onClick={loadDashboard}
              className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
            >
              Refresh
            </button>
          }
        />

        {loading && (
          <div className="text-sm text-gray-500">
            Loading dealer dashboard...
          </div>
        )}

        {dashboard && (
          <>
            <DealerSummary summary={dashboard.summary} />

            <DealerBatchTable batches={dashboard.recent_batches || []} />

            <DealerShipmentTable shipments={dashboard.recent_shipments || []} />

            <DealerPaymentTable payments={dashboard.recent_payments || []} />
          </>
        )}
      </div>
    </div>
  );
}