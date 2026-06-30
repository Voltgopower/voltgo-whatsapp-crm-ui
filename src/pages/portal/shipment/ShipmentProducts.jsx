import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const inputClass = "border rounded-lg px-3 py-2 text-sm";

export default function ShipmentProducts({ shipment }) {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    product_id: "",
    qty: "",
    unit_price: "",
    discount: "",
    notes: "",
  });

  async function loadItems() {
    const res = await axios.get(
      `${API_BASE}/portal/shipments/${shipment.id}/items`
    );

    setItems(Array.isArray(res.data) ? res.data : []);
  }

  async function loadProducts() {
    const res = await axios.get(`${API_BASE}/portal/products`);
    setProducts(Array.isArray(res.data) ? res.data : []);
  }

  function selectedProduct() {
    return products.find((p) => String(p.id) === String(form.product_id));
  }

  function handleSelectProduct(productId) {
    const product = products.find((p) => String(p.id) === String(productId));

    setForm({
      ...form,
      product_id: productId,
      unit_price: product?.dealer_price || "",
    });
  }

  async function saveItem(e) {
    e.preventDefault();

    if (!form.product_id) {
      alert("Please select a product");
      return;
    }

    if (!form.qty) {
      alert("Quantity is required");
      return;
    }

    setSaving(true);

    try {
      const product = selectedProduct();

      await axios.post(`${API_BASE}/portal/shipments/${shipment.id}/items`, {
        product_id: Number(form.product_id),
        description_snapshot: product?.product_name || null,
        qty: Number(form.qty || 0),
        unit_price: Number(form.unit_price || 0),
        discount: Number(form.discount || 0),
        notes: form.notes || null,
      });

      setForm({
        product_id: "",
        qty: "",
        unit_price: "",
        discount: "",
        notes: "",
      });

      setShowForm(false);
      await loadItems();
    } catch (err) {
      console.error("Create shipment product failed:", err);
      alert("Create shipment product failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id) {
    if (!window.confirm("Delete this shipment product?")) return;

    try {
      await axios.delete(`${API_BASE}/portal/shipment-items/${id}`);
      await loadItems();
    } catch (err) {
      console.error("Delete shipment product failed:", err);
      alert("Delete shipment product failed");
    }
  }

  useEffect(() => {
    if (shipment?.id) {
      loadItems();
      loadProducts();
    }
  }, [shipment?.id]);

  const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const totalAmount = items.reduce(
    (sum, item) =>
      sum +
      Number(item.qty || 0) * Number(item.unit_price || 0) -
      Number(item.discount || 0),
    0
  );

  const product = selectedProduct();

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <div className="font-semibold">Shipment Products</div>
          <div className="text-sm text-gray-500 mt-1">
            Products included in this shipment.
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="px-3 py-1 text-sm border rounded-lg bg-white hover:bg-gray-50"
        >
          {showForm ? "Cancel" : "+ Add Product"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveItem} className="p-4 border-b bg-gray-50 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <select
              value={form.product_id}
              onChange={(e) => handleSelectProduct(e.target.value)}
              className={inputClass}
            >
              <option value="">Select Product</option>
              {products
                .filter((p) => p.active !== false)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} · {p.product_name}
                  </option>
                ))}
            </select>

            <input
              type="number"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              className={inputClass}
              placeholder="Qty"
            />

            <input
              type="number"
              step="0.01"
              value={form.unit_price}
              onChange={(e) =>
                setForm({ ...form, unit_price: e.target.value })
              }
              className={inputClass}
              placeholder="Unit Price"
            />

            <input
              type="number"
              step="0.01"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
              className={inputClass}
              placeholder="Discount"
            />
          </div>

          {product && (
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg bg-white border p-3">
                <div className="text-gray-500">SKU</div>
                <div className="font-medium">{product.sku || "-"}</div>
              </div>

              <div className="rounded-lg bg-white border p-3">
                <div className="text-gray-500">Product</div>
                <div className="font-medium">
                  {product.product_name || "-"}
                </div>
              </div>

              <div className="rounded-lg bg-white border p-3">
                <div className="text-gray-500">Specification</div>
                <div className="font-medium">
                  {product.voltage ? `${product.voltage}V` : "-"}
                  {product.capacity ? ` / ${product.capacity}Ah` : ""}
                </div>
              </div>

              <div className="rounded-lg bg-white border p-3">
                <div className="text-gray-500">Category</div>
                <div className="font-medium">{product.category || "-"}</div>
              </div>
            </div>
          )}

          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Notes"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 gap-4 p-4 border-b bg-white">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Total Qty</div>
          <div className="text-2xl font-bold mt-1">{totalQty}</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Product Amount</div>
          <div className="text-2xl font-bold mt-1">
            ${Number(totalAmount || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="text-left px-4 py-3">SKU</th>
            <th className="text-left px-4 py-3">Product</th>
            <th className="text-right px-4 py-3">Qty</th>
            <th className="text-right px-4 py-3">Unit Price</th>
            <th className="text-right px-4 py-3">Discount</th>
            <th className="text-right px-4 py-3">Amount</th>
            <th className="text-left px-4 py-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {items.length > 0 ? (
            items.map((item) => {
              const qty = Number(item.qty || 0);
              const unitPrice = Number(item.unit_price || 0);
              const discount = Number(item.discount || 0);
              const amount = qty * unitPrice - discount;

              return (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 font-medium">
                    {item.sku || "-"}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {item.product_name ||
                        item.description_snapshot ||
                        "-"}
                    </div>

                    {item.notes && (
                      <div className="text-xs text-gray-500 mt-1">
                        {item.notes}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">{qty}</td>

                  <td className="px-4 py-3 text-right">
                    ${unitPrice.toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    ${discount.toFixed(2)}
                  </td>

                  <td className="px-4 py-3 text-right font-medium">
                    ${amount.toFixed(2)}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="px-4 py-6 text-gray-500" colSpan={7}>
                No products linked to this shipment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}