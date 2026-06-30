import React, { useEffect, useState } from "react";
import axios from "axios";

import ShipmentCard from "./shipment/ShipmentCard";
import ShipmentProducts from "./shipment/ShipmentProducts";
import ShipmentAllocation from "./shipment/ShipmentAllocation";
import ShipmentEvidence from "./shipment/ShipmentEvidence";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://voltgo-whatsapp-support-production.up.railway.app/api";

const inputClass = "border rounded-lg px-3 py-2 text-sm";
const secondaryButtonClass =
  "px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm";
const primaryButtonClass =
  "px-5 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50";

export default function ShipmentPanel({ batchId }) {
  const [shipments, setShipments] = useState([]);
  const [openShipmentId, setOpenShipmentId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableAllocations, setAvailableAllocations] = useState([]);
  const [shipmentAllocations, setShipmentAllocations] = useState({});
  const [showAllocationForm, setShowAllocationForm] = useState({});

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
    if (saving) return;

    if (!form.shipment_no.trim()) {
      alert("Shipment No is required");
      return;
    }

    setSaving(true);

    try {
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
    } catch (err) {
      console.error("Create shipment failed:", err);
      alert("Create shipment failed");
    } finally {
      setSaving(false);
    }
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

    setShowAllocationForm((prev) => ({
      ...prev,
      [shipmentId]: false,
    }));

    await loadShipmentAllocations(shipmentId);
    await loadShipments();
  }

  async function unlinkAllocation(shipmentId, shipmentAllocationId) {
    if (!window.confirm("Unlink this payment allocation?")) return;

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

    return Number(shipment.linked_amount || localAmount || 0);
  }

  function getAvailableOptions(shipmentId) {
    const linkedIds = (shipmentAllocations[shipmentId] || []).map((item) =>
      Number(item.allocation_id)
    );

    return availableAllocations.filter(
      (item) => !linkedIds.includes(Number(item.id))
    );
  }

  function formatMoney(value) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  const totalShipments = shipments.length;
  const inTransitCount = shipments.filter(
    (s) => s.status === "in_transit"
  ).length;
  const deliveredCount = shipments.filter(
    (s) => s.status === "delivered"
  ).length;
  const totalLinkedAmount = shipments.reduce(
    (sum, s) => sum + getShipmentAmount(s),
    0
  );

  useEffect(() => {
    if (batchId) {
      loadShipments();
      loadAvailableAllocations();
    }
  }, [batchId]);

  return (
    <div className="space-y-5">
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
                onChange={(e) =>
                  setForm({ ...form, carrier: e.target.value })
                }
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

            <button
              type="submit"
              disabled={saving}
              className={`${primaryButtonClass} mt-4`}
            >
              {saving ? "Saving..." : "Save Shipment"}
            </button>
          </form>
        )}

        <div className="grid grid-cols-4 gap-4 p-5">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Shipment Records</div>
            <div className="text-3xl font-bold mt-2">{totalShipments}</div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">In Transit</div>
            <div className="text-3xl font-bold mt-2">{inTransitCount}</div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Delivered</div>
            <div className="text-3xl font-bold mt-2">{deliveredCount}</div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Linked Amount</div>
            <div className="text-3xl font-bold mt-2">
              {formatMoney(totalLinkedAmount)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b font-semibold">Shipment List</div>

        <div className="space-y-3 p-5">
          {shipments.map((shipment) => {
            const isOpen = openShipmentId === shipment.id;
            const allocations = shipmentAllocations[shipment.id] || [];
            const linkedAmount = getShipmentAmount(shipment);

            return (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                isOpen={isOpen}
                linkedAmount={linkedAmount.toFixed(2)}
                onToggle={async () => {
                  const nextId = isOpen ? null : shipment.id;
                  setOpenShipmentId(nextId);

                  if (nextId) {
                    await loadShipmentAllocations(nextId);
                  }
                }}
              >
                <div className="border-t bg-gray-50 p-4 space-y-4">
  <ShipmentProducts shipment={shipment} />

  <ShipmentAllocation
    shipment={shipment}
    allocations={allocations}
    availableOptions={getAvailableOptions(shipment.id)}
    allocationForm={allocationForm}
    setAllocationForm={setAllocationForm}
    showAllocationForm={showAllocationForm}
    setShowAllocationForm={setShowAllocationForm}
    linkAllocation={linkAllocation}
    unlinkAllocation={unlinkAllocation}
  />

  <ShipmentEvidence shipment={shipment} />
</div>
              </ShipmentCard>
            );
          })}

          {shipments.length === 0 && (
            <div className="rounded-xl border bg-white p-6 text-gray-500">
              No shipments yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}