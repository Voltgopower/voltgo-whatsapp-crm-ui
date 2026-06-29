import DocumentPage from "./DocumentPage";
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api";

const cardClass = "rounded-xl border bg-white p-5";
const cardTitleClass = "text-lg font-semibold mb-4 pb-3 border-b";
const inputClass = "border rounded-lg px-3 py-2 text-sm";
const secondaryButtonClass =
  "px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm";
const primaryButtonClass =
  "px-5 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50";

export default function ShipmentPanel({ batchId }) {
  const [shipments, setShipments] = useState([]);
  const [openShipmentId, setOpenShipmentId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [availableAllocations, setAvailableAllocations] = useState([]);
  const [shipmentAllocations, setShipmentAllocations] = useState({});

  const [form, setForm] = useState({
    shipment_no: "",
    carrier: "",
    tracking_no: "",
    bol_no: "",
    container_no: "",
    status: "draft",
  });

  const [allocationForm, setAllocationForm] = useState({
    allocation_id: "",
    allocated_amount: "",
  });

  async function loadShipments() {
    const res = await axios.get(
      `${API_BASE}/portal/batches/${batchId}/shipments`
    );

    setShipments(Array.isArray(res.data) ? res.data : []);
  }

  async function loadAvailableAllocations() {
    const res = await axios.get(`${API_BASE}/portal/available-allocations`);

    setAvailableAllocations(Array.isArray(res.data) ? res.data : []);
  }

  async function loadShipmentAllocations(shipmentId) {
    const res = await axios.get(
      `${API_BASE}/portal/shipments/${shipmentId}/allocations`
    );

    setShipmentAllocations((prev) => ({
      ...prev,
      [shipmentId]: Array.isArray(res.data) ? res.data : [],
    }));
  }

  async function createShipment(e) {
    e.preventDefault();

    if (!form.shipment_no) {
      alert("Shipment No is required");
      return;
    }

    await axios.post(`${API_BASE}/portal/shipments`, {
      batch_id: batchId,
      ...form,
    });

    setForm({
      shipment_no: "",
      carrier: "",
      tracking_no: "",
      bol_no: "",
      container_no: "",
      status: "draft",
    });

    setShowForm(false);
    await loadShipments();
  }

  async function linkAllocation(shipmentId) {
    if (!allocationForm.allocation_id) {
      alert("Please select an allocation");
      return;
    }

    await axios.post(`${API_BASE}/portal/shipment-allocations`, {
      shipment_id: shipmentId,
      allocation_id: allocationForm.allocation_id,
      allocated_amount: allocationForm.allocated_amount || 0,
    });

    setAllocationForm({
      allocation_id: "",
      allocated_amount: "",
    });

    await loadShipmentAllocations(shipmentId);
    await loadShipments();
  }

  async function unlinkAllocation(shipmentId, shipmentAllocationId) {
    if (!window.confirm("Unlink this payment allocation?")) {
      return;
    }

    await axios.delete(
      `${API_BASE}/portal/shipment-allocations/${shipmentAllocationId}`
    );

    await loadShipmentAllocations(shipmentId);
    await loadShipments();
  }

  function getShipmentAmount(shipment) {
    const localAmount = (shipmentAllocations[shipment.id] || []).reduce(
      (sum, item) => sum + Number(item.allocated_amount || 0),
      0
    );

    return Number(shipment.linked_amount || localAmount || 0).toFixed(2);
  }

  function getAvailableOptions(shipmentId) {
    const linkedIds = (shipmentAllocations[shipmentId] || []).map((item) =>
      Number(item.allocation_id)
    );

    return availableAllocations.filter(
      (item) => !linkedIds.includes(Number(item.id))
    );
  }

  function formatStatus(status) {
    if (!status) return "-";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  useEffect(() => {
    if (batchId) {
      loadShipments();
      loadAvailableAllocations();
    }
  }, [batchId]);

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="font-semibold">Shipments</div>

        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className={secondaryButtonClass}
        >
          {showForm ? "Cancel" : "+ Add Shipment"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createShipment} className="p-5 border-b bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            <input
              value={form.shipment_no}
              onChange={(e) =>
                setForm({ ...form, shipment_no: e.target.value })
              }
              className={inputClass}
              placeholder="Shipment No"
            />

            <input
              value={form.carrier}
              onChange={(e) => setForm({ ...form, carrier: e.target.value })}
              className={inputClass}
              placeholder="Carrier"
            />

            <input
              value={form.tracking_no}
              onChange={(e) =>
                setForm({ ...form, tracking_no: e.target.value })
              }
              className={inputClass}
              placeholder="Tracking No"
            />

            <input
              value={form.bol_no}
              onChange={(e) => setForm({ ...form, bol_no: e.target.value })}
              className={inputClass}
              placeholder="B/L No"
            />

            <input
              value={form.container_no}
              onChange={(e) =>
                setForm({ ...form, container_no: e.target.value })
              }
              className={inputClass}
              placeholder="Container No"
            />

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputClass}
            >
              <option value="draft">Draft</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <button type="submit" className={`${primaryButtonClass} mt-4`}>
            Save Shipment
          </button>
        </form>
      )}

      <div className="space-y-4 p-5">
        {shipments.map((s) => {
          const isOpen = openShipmentId === s.id;

          return (
            <div key={s.id} className="rounded-xl border bg-white shadow-sm">
              <div className="flex items-start justify-between p-5">
                <div>
                  <div className="text-lg font-semibold">
                    Shipment #{s.shipment_no}
                  </div>

                  <div className="text-sm text-gray-500 mt-1">
                    {s.carrier || "-"} · {formatStatus(s.status)}
                  </div>

                  <div className="text-xs text-gray-400 mt-1">
                    Tracking: {s.tracking_no || "-"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const nextId = isOpen ? null : s.id;
                    setOpenShipmentId(nextId);

                    if (nextId) {
                      await loadShipmentAllocations(nextId);
                    }
                  }}
                  className={secondaryButtonClass}
                >
                  {isOpen ? "Collapse" : "Expand"}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 px-5 pb-5">
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Carrier</div>
                  <div className="font-semibold mt-1">{s.carrier || "-"}</div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Tracking</div>
                  <div className="font-semibold mt-1">
                    {s.tracking_no || "-"}
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Linked Payment</div>
                  <div className="font-semibold mt-1">
                    {s.linked_payment || "-"}
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Linked Amount</div>
                  <div className="font-semibold mt-1">
                    ${getShipmentAmount(s)}
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="border-t bg-gray-50 p-5">
                  <div className="space-y-5">
                    <div className={cardClass}>
                      <div className={cardTitleClass}>
                        Shipment Information
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Shipment No</div>
                          <div className="font-medium">
                            {s.shipment_no || "-"}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500">Carrier</div>
                          <div className="font-medium">{s.carrier || "-"}</div>
                        </div>

                        <div>
                          <div className="text-gray-500">Tracking No</div>
                          <div className="font-medium">
                            {s.tracking_no || "-"}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500">B/L No</div>
                          <div className="font-medium">{s.bol_no || "-"}</div>
                        </div>

                        <div>
                          <div className="text-gray-500">Container No</div>
                          <div className="font-medium">
                            {s.container_no || "-"}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500">Status</div>
                          <div className="font-medium">
                            {formatStatus(s.status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={cardClass}>
                      <div className={cardTitleClass}>
                        Linked Payment Allocations
                      </div>

                      <div className="flex items-end gap-3 mb-4">
                        <select
                          value={allocationForm.allocation_id}
                          onChange={(e) =>
                            setAllocationForm({
                              ...allocationForm,
                              allocation_id: e.target.value,
                            })
                          }
                          className="flex-1 border rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="">Select Allocation</option>
                          {getAvailableOptions(s.id).map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.method || "-"} · {a.reference_no || "-"} · $
                              {a.allocated_amount}
                            </option>
                          ))}
                        </select>

                        <input
                          value={allocationForm.allocated_amount}
                          onChange={(e) =>
                            setAllocationForm({
                              ...allocationForm,
                              allocated_amount: e.target.value,
                            })
                          }
                          className="w-40 border rounded-lg px-3 py-2 text-sm"
                          placeholder="Amount"
                        />

                        <button
                          type="button"
                          onClick={() => linkAllocation(s.id)}
                          className="px-6 py-2 rounded-lg bg-gray-900 text-white text-sm whitespace-nowrap"
                        >
                          Link
                        </button>
                      </div>

                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="text-left px-5 py-3">Method</th>
                            <th className="text-left px-5 py-3">Reference</th>
                            <th className="text-right px-5 py-3">Amount</th>
                            <th className="text-left px-5 py-3">Action</th>
                          </tr>
                        </thead>

                        <tbody>
                          {(shipmentAllocations[s.id] || []).map((a) => (
                            <tr key={a.id} className="border-t">
                              <td className="px-5 py-3">{a.method || "-"}</td>
                              <td className="px-5 py-3">
                                {a.reference_no || "-"}
                              </td>
                              <td className="px-5 py-3 text-right">
                                ${Number(a.allocated_amount || 0).toFixed(2)}
                              </td>
                              <td className="px-5 py-3">
                                <button
                                  type="button"
                                  onClick={() => unlinkAllocation(s.id, a.id)}
                                  className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                                >
                                  Unlink
                                </button>
                              </td>
                            </tr>
                          ))}

                          {(shipmentAllocations[s.id] || []).length === 0 && (
                            <tr>
                              <td
                                className="px-5 py-6 text-gray-500"
                                colSpan="4"
                              >
                                No linked allocations.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className={cardClass}>
                      <div className={cardTitleClass}>Shipment Evidence</div>

                      <DocumentPage
                        relatedType="shipment"
                        relatedId={s.id}
                        compact
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {shipments.length === 0 && (
          <div className="rounded-xl border bg-white p-6 text-gray-500">
            No shipments yet.
          </div>
        )}
      </div>
    </div>
  );
}
