import { useEffect, useState } from "react";
import { getBranches } from "../api/branchAPI";
import { getProducts } from "../api/productAPI";
import { updateStock } from "../api/inventoryAPI";

export default function InventoryForm({ refresh }) {

  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    branchId: "",
    productId: "",
    stock: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const b = await getBranches();
      const p = await getProducts();

      setBranches(b.data);
      setProducts(p.data);

    } catch {
      setError("Failed to load branches/products");
    }
  };

  const submit = async () => {
    if (!form.branchId || !form.productId) {
      setError("Select branch & product");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await updateStock(form);

      setForm({
        branchId: "",
        productId: "",
        stock: ""
      });

      refresh();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Stock update failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 shadow rounded">

      <h2 className="font-bold mb-3">
        Update Inventory
      </h2>

      {error && (
        <div className="bg-red-100 p-2 mb-2 text-red-600">
          {error}
        </div>
      )}

      <select
        className="border p-2 w-full mb-2"
        value={form.branchId}
        onChange={(e) =>
          setForm({ ...form, branchId: e.target.value })
        }
      >
        <option value="">Select Branch</option>
        {branches.map((b) => (
          <option key={b._id} value={b._id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        className="border p-2 w-full mb-2"
        value={form.productId}
        onChange={(e) =>
          setForm({ ...form, productId: e.target.value })
        }
      >
        <option value="">Select Product</option>
        {products.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Stock Quantity"
        className="border p-2 w-full mb-2"
        value={form.stock}
        onChange={(e) =>
          setForm({ ...form, stock: e.target.value })
        }
      />

      <button
        onClick={submit}
        disabled={loading}
        className="bg-black text-white px-4 py-2"
      >
        {loading ? "Updating..." : "Update Stock"}
      </button>

    </div>
  );
}
