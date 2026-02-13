import { useState } from "react";
import { createBranch } from "../api/branchAPI";

export default function BranchForm({ refresh }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("steelx_token");

    if (!form.name || !form.address) {
      setError("Branch Name and Address are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Yahan token pass karna zaroori hai
      await createBranch(form, token);

      // Form clear karo
      setForm({ name: "", address: "", phone: "" });
      
      // List update karne ke liye refresh function call karo
      refresh();
      alert("✅ Branch created successfully!");

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create branch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100">
      <h3 className="text-lg font-bold mb-4 text-slate-800">Create New Branch</h3>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl mb-4 text-sm border border-rose-100">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <input
          placeholder="Branch Name"
          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Address"
          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <input
          placeholder="Phone Number"
          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold transition active:scale-95 disabled:bg-slate-300"
        >
          {loading ? "Creating..." : "Create Branch"}
        </button>
      </form>
    </div>
  );
}