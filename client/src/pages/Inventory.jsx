import { useEffect, useState } from "react";
import InventoryForm from "../components/InventoryForm";
import InventoryTable from "../components/InventoryTable";
import { getInventory } from "../api/inventoryAPI";

export default function Inventory() {
  const [branchId, setBranchId] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Token nikalna zaroori hai authentication ke liye
  const token = localStorage.getItem("steelx_token");

  const loadInventory = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      setBranchId(id);
      
      // API call mein token bhej rahe hain
      const res = await getInventory(id, token);
      
      // Agar apiRequest use kar rahe ho toh res seedha data hota hai
      setData(res.data || res); 
    } catch (err) {
      console.error("Inventory Load Error:", err);
      alert("Failed to load inventory for this branch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-4xl font-black text-slate-900">Inventory Management</h2>
        <p className="text-slate-500 mt-2 font-medium">Track and update stock levels across branches.</p>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {/* Step 1: Branch Select/Input */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-bold mb-4 text-slate-800">Select Branch</h3>
           <div className="flex gap-4">
              <input
                placeholder="Enter Branch ID (e.g. 65a...)"
                className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
              />
              <button 
                onClick={() => loadInventory(branchId)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 rounded-2xl font-bold transition active:scale-95"
              >
                Fetch Stock
              </button>
           </div>
        </div>

        {/* Step 2: Add Inventory Form */}
        {branchId && (
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
             <h3 className="text-xl font-bold mb-6 text-slate-800">Update Stock for Branch</h3>
             <InventoryForm branchId={branchId} refresh={() => loadInventory(branchId)} />
          </div>
        )}

        {/* Step 3: Inventory Table */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
           <h3 className="text-xl font-bold mb-6 text-slate-800">Current Stock Levels</h3>
           {loading ? (
             <div className="py-20 text-center text-slate-400 font-bold animate-pulse">Fetching inventory data...</div>
           ) : data.length > 0 ? (
             <InventoryTable data={data} />
           ) : (
             <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed">
                Enter a valid Branch ID and click Fetch to see stock.
             </div>
           )}
        </div>
      </div>
    </div>
  );
}