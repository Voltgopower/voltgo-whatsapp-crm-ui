import StatementCenter from "./StatementCenter";
import React, { useEffect, useState } from "react";
import axios from "axios";

import BatchDetail from "./BatchDetail";
import BatchList from "./BatchList";
import NewBatchPage from "./NewBatchPage";
import DocumentPage from "./DocumentPage";
import PortalSidebar from "./PortalSidebar";
import ReportCenter from "./ReportCenter";
import ProductLibrary from "./ProductLibrary";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export default function PortalPage() {
  const [tab, setTab] = useState("batches");
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadBatches() {
    setLoading(true);

    try {
      const res = await axios.get(`${API_BASE}/portal/batches`);
      setBatches(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  }

  async function loadBatchDetail(id) {
    setLoading(true);

    try {
      const res = await axios.get(`${API_BASE}/portal/batches/${id}`);
      setSelectedBatch(res.data);
      setTab("batchDetail");
    } finally {
      setLoading(false);
    }
  }

  function handleSetTab(nextTab) {
    setTab(nextTab);

    if (nextTab === "batches") {
      setSelectedBatch(null);
      loadBatches();
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  return (
    <div className="h-full bg-gray-100 text-gray-900 flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">Voltgo Portal</div>
          <div className="text-sm text-gray-500">
            Batch, payment, document, and report center
          </div>
        </div>

        <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() => setTab("newBatch")}
    className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm"
  >
    + New Batch
  </button>

  <button
    type="button"
    onClick={loadBatches}
    className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
  >
    Refresh
  </button>
</div>
      </div>

      <div className="flex-1 min-h-0 flex">
        <PortalSidebar tab={tab} setTab={handleSetTab} />

        <div className="flex-1 overflow-auto p-6">
          {loading && <div className="text-gray-500 mb-4">Loading...</div>}

          {tab === "newBatch" && (
  <NewBatchPage
    onCancel={() => handleSetTab("batches")}
    onCreated={async (createdBatch) => {
  if (createdBatch?.id) {
    await loadBatchDetail(createdBatch.id);
  } else {
    handleSetTab("batches");
  }
}}
  />
)}
          {tab === "batches" && (
            <BatchList batches={batches} onSelectBatch={loadBatchDetail} />
          )}

          {tab === "batchDetail" && selectedBatch && (
            <BatchDetail
             batch={selectedBatch}
             onBack={() => handleSetTab("batches")}
             onRefresh={() => loadBatchDetail(selectedBatch.id)}
          />
          )}
          {tab === "products" && <ProductLibrary />}

          {tab === "documents" && <DocumentPage />}

          {tab === "reports" && <ReportCenter />}

          {tab === "statements" && <StatementCenter />}
        </div>
      </div>
    </div>
  );
}