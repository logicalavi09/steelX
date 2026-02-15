import { useEffect, useState } from "react";
import { getAllOrders, updateOrderStatus } from "../api/orderAPI";

export default function StaffOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("steelx_token");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders(token);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus, token);
      fetchAll(); // List refresh karo
      alert("Status Updated!");
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const getStatusColor = (s) => {
    const colors = {
      pending: "bg-amber-100 text-amber-700",
      processing: "bg-blue-100 text-blue-700",
      ready: "bg-indigo-100 text-indigo-700",
      delivered: "bg-emerald-100 text-emerald-700",
    };
    return colors[s] || "bg-slate-100";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-4xl font-black text-slate-900">ORDER PIPELINE</h2>
        <p className="text-slate-500 mt-2 font-medium">Manage and dispatch industrial shipments.</p>
      </header>

      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-[0.2em] font-black">
            <tr>
              <th className="p-6">UID</th>
              <th className="p-6">Customer</th>
              <th className="p-6">Total Amount</th>
              <th className="p-6">Current Status</th>
              <th className="p-6 text-right">Update Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {loading ? (
              <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold">Scanning database...</td></tr>
            ) : orders.map(o => (
              <tr key={o._id} className="hover:bg-slate-50/50 transition">
                <td className="p-6 font-mono text-xs text-blue-600 font-bold">#{o._id.slice(-6)}</td>
                <td className="p-6 text-slate-900 font-bold">{o.customer?.name || 'N/A'}</td>
                <td className="p-6 font-black text-slate-900">₹{o.totalAmount}</td>
                <td className="p-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${getStatusColor(o.status)}`}>
                    {o.status}
                  </span>
                </td>
                <td className="p-6 text-right">
                  <select 
                    value={o.status}
                    onChange={(e) => handleStatusChange(o._id, e.target.value)}
                    className="px-4 py-2 rounded-xl bg-slate-100 border-none text-xs font-black outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="ready">Ready</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}