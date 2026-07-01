import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const emptyForm = {
  sku: "",
  product_name: "",
  description: "",
  category: "",
  chemistry: "",
  voltage: "",
  capacity: "",
  unit: "pcs",
  weight: "",
  volume: "",
  msrp: "",
  dealer_price: "",
  cost: "",
  active: true,
};

export default function ProductLibrary() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/portal/products`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Load products failed:", err);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  async function saveProduct(e) {
    e.preventDefault();

    if (!form.sku.trim()) {
      alert("SKU is required");
      return;
    }

    if (!form.product_name.trim()) {
      alert("Product Name is required");
      return;
    }

    setSaving(true);

    try {
      await axios.post(`${API_BASE}/portal/products`, {
        ...form,
        voltage: form.voltage || null,
        capacity: form.capacity || null,
        weight: form.weight || null,
        volume: form.volume || null,
        msrp: form.msrp || 0,
        dealer_price: form.dealer_price || 0,
        cost: form.cost || 0,
      });

      setForm(emptyForm);
      setShowForm(false);
      await loadProducts();
    } catch (err) {
      console.error("Create product failed:", err);
      alert("Create product failed");
    } finally {
      setSaving(false);
    }
  }
async function deleteProduct(product) {

  if (
    !window.confirm(
      `Delete product "${product.product_name}" ?`
    )
  ) {
    return;
  }

  try {

    await axios.delete(
      `${API_BASE}/portal/products/${product.id}`
    );

    await loadProducts();

  } catch (err) {

    console.error(err);

    alert(
      err.response?.data?.error ||
      "Failed to delete product"
    );

  }

}

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <div className="font-semibold">Product Library</div>
            <div className="text-sm text-gray-500 mt-1">
              Central product master data used by shipment products.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm"
          >
            {showForm ? "Cancel" : "+ New Product"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={saveProduct} className="p-5 border-b bg-gray-50">
            <div className="grid grid-cols-4 gap-4">
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="SKU *"
              />

              <input
                value={form.product_name}
                onChange={(e) =>
                  setForm({ ...form, product_name: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Product Name *"
              />

              <input
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Category"
              />

              <input
                value={form.chemistry}
                onChange={(e) =>
                  setForm({ ...form, chemistry: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Chemistry"
              />

              <input
                type="number"
                value={form.voltage}
                onChange={(e) =>
                  setForm({ ...form, voltage: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Voltage"
              />

              <input
                type="number"
                value={form.capacity}
                onChange={(e) =>
                  setForm({ ...form, capacity: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Capacity"
              />

              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Unit"
              />

              <input
                type="number"
                value={form.weight}
                onChange={(e) =>
                  setForm({ ...form, weight: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Weight"
              />

              <input
                type="number"
                value={form.volume}
                onChange={(e) =>
                  setForm({ ...form, volume: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Volume"
              />

              <input
                type="number"
                step="0.01"
                value={form.msrp}
                onChange={(e) => setForm({ ...form, msrp: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="MSRP"
              />

              <input
                type="number"
                step="0.01"
                value={form.dealer_price}
                onChange={(e) =>
                  setForm({ ...form, dealer_price: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Dealer Price"
              />

              <input
                type="number"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Cost"
              />
            </div>

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm mt-4"
              placeholder="Description"
            />

            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                />
                Active product
              </label>

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

        <div className="grid grid-cols-4 gap-4 p-5">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Products</div>
            <div className="text-3xl font-bold mt-2">{products.length}</div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-3xl font-bold mt-2">
              {products.filter((p) => p.active).length}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Categories</div>
            <div className="text-3xl font-bold mt-2">
              {new Set(products.map((p) => p.category).filter(Boolean)).size}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">Inactive</div>
            <div className="text-3xl font-bold mt-2">
              {products.filter((p) => !p.active).length}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="font-semibold">Products</div>

          <button
            type="button"
            onClick={loadProducts}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="px-5 py-4 text-sm text-gray-500">
            Loading products...
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-5 py-3">SKU</th>
              <th className="text-left px-5 py-3">Product Name</th>
              <th className="text-left px-5 py-3">Category</th>
              <th className="text-left px-5 py-3">Chemistry</th>
              <th className="text-right px-5 py-3">Voltage</th>
              <th className="text-right px-5 py-3">Capacity</th>
              <th className="text-right px-5 py-3">Dealer Price</th>
              <th className="text-left px-5 py-3">Status</th>

<th className="text-center px-5 py-3">
  Action
</th>
            </tr>
          </thead>

          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="px-5 py-3 font-medium">
                    {product.sku || "-"}
                  </td>

                  <td className="px-5 py-3">
                    <div className="font-medium">
                      {product.product_name || "-"}
                    </div>

                    {product.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {product.description}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3">{product.category || "-"}</td>
                  <td className="px-5 py-3">{product.chemistry || "-"}</td>

                  <td className="px-5 py-3 text-right">
                    {product.voltage ? `${product.voltage}V` : "-"}
                  </td>

                  <td className="px-5 py-3 text-right">
                    {product.capacity ? `${product.capacity}Ah` : "-"}
                  </td>

                  <td className="px-5 py-3 text-right">
                    ${Number(product.dealer_price || 0).toFixed(2)}
                  </td>

                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs ${
                        product.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                 <td className="px-5 py-3 text-center">

  <button
    className="px-3 py-1 rounded border text-sm hover:bg-gray-50"
  >
    Edit
  </button>

  <button
    onClick={() => deleteProduct(product)}
    className="ml-2 px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
  >
    Delete
  </button>

</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-5 py-8 text-center text-gray-500"
                  colSpan={9}
                >
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}