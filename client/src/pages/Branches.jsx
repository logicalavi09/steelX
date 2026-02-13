import { useEffect, useState } from "react";
import { getBranches } from "../api/branchAPI";
import BranchForm from "../components/BranchForm";
import BranchTable from "../components/BranchTable";

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("steelx_token");

  const fetchBranches = async () => {
    try {
      setLoading(true);
      // Token pass kar rahe hain
      const res = await getBranches(token);
      setBranches(res); // apiRequest seedha data return karta hai
    } catch (err) {
      console.error(err);
      alert("Failed to load branches. Check if backend is on 5010.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900">Branch Management</h2>
        <p className="text-slate-500 mt-2">Create and manage your supply chain nodes.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
           <BranchForm refresh={fetchBranches} />
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-bold mb-6">Registered Branches</h3>
           {loading ? (
             <p className="text-center py-10 text-slate-400">Loading branches...</p>
           ) : (
             <BranchTable branches={branches} />
           )}
        </div>
      </div>
    </div>
  );
}