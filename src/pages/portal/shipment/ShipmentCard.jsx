import React, { useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://voltgo-whatsapp-support-production.up.railway.app/api";

const inputClass = "border rounded-lg px-3 py-2 text-sm";
const secondaryButtonClass =
  "px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm";
const dangerButtonClass =
  "px-4 py-2 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 text-sm";
const primaryButtonClass =
  "px-5 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50";

function formatStatus(status) {
  if (!status) return "-";
  return status.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ShipmentCard({
  shipment,
  isOpen,
  linkedAmount,
  onToggle,
  onUpdated,
  children,
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    shipment_no: shipment.shipment_no || "",
    carrier: shipment.carrier || "",
    tracking_no: shipment.tracking_no || "",
    bol_no: shipment.bol_no || "",
    container_no: shipment.container_no || "",
    status: shipment.status || "draft",
    notes: shipment.notes || "",
  });

  async function saveShipment(e) {
    e.preventDefault();

    if (!form.shipment_no.trim()) {
      alert("Shipment No is required");
      return;
    }

    setSaving(true);

    try {
      await axios.put(`${API_BASE}/portal/shipments/${shipment.id}`, {
        ...form,
      });

      setEditing(false);

      if (onUpdated) {
        await onUpdated();
      }
    } catch (err) {
      console.error("Update shipment failed:", err);
      alert(err.response?.data?.error || "Update shipment failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteShipment() {
    if (
      !window.confirm(
        `Delete shipment ${shipment.shipment_no || shipment.id}?`
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      await axios.delete(`${API_BASE}/portal/shipments/${shipment.id}`);

      if (onUpdated) {
        await onUpdated();
      }
    } catch (err) {
      console.error("Delete shipment failed:", err);
      alert(err.response?.data?.error || "Delete shipment failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((prev) => !prev)}
            className={secondaryButtonClass}
          >
            {editing ? "Cancel" : "Edit"}
          </button>

          <button
            type="button"
            onClick={deleteShipment}
            disabled={deleting}
            className={dangerButtonClass}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>

          <button type="button" onClick={onToggle} className={secondaryButtonClass}>
            {isOpen ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {editing && (
        <form onSubmit={saveShipment} className="border-t bg-gray-50 p-4">
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
              <option value="ready">Ready</option>
              <option value="booked">Booked</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="closed">Closed</option>
            </select>

            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="col-span-3 border rounded-lg px-3 py-2 text-sm"
              placeholder="Notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end mt-4">
            <button type="submit" disabled={saving} className={primaryButtonClass}>
              {saving ? "Saving..." : "Save Shipment"}
            </button>
          </div>
        </form>
      )}

      {isOpen && children}
    </div>
  );
}