import { useState } from "react";
import { createProduct } from "../api/productAPI";

export default function ProductForm({ refresh }) {
  const [form, setForm] = useState({
    name: "",
    category: "steel",
    unit: "",
    basePrice: "",
    description: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    // Token yahan se uthao
    const token = localStorage.getItem("steelx_token");

    if (!form.name || !form.basePrice) {
      setError("Name & Price required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // TOKEN YAHAN PASS KARNA ZAROORI HAI
      await createProduct(form, token);

      setForm({
        name: "",
        category: "steel",
        unit: "",
        basePrice: "",
        description: ""
      });

      refresh(); // List refresh karne ke liye
      alert("Product Added Successfully!");

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100">
      <h2 className="font-bold text-lg mb-4 text-slate-800">Add New Product</h2>

      {error && (
        <div className="bg-rose-50 p-3 mb-4 text-rose-600 rounded-xl text-sm font-medium border border-rose-100">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-3">
        <input
          placeholder="Product Name"
          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <select
            className="px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="steel">Steel</option>
            <option value="aluminium">Aluminium</option>
            <option value="custom">Custom</option>
          </select>

          <input
            placeholder="Unit (kg, mt, etc.)"
            className="px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
        </div>

        <input
          type="number"
          placeholder="Base Price (₹)"
          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold"
          value={form.basePrice}
          onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
        />

        <textarea
          placeholder="Product Description..."
          rows="3"
          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all transform active:scale-95 disabled:bg-slate-300"
        >
          {loading ? "Adding to Database..." : "🚀 Add Product"}
        </button>
      </div>
    </div>
  );
}