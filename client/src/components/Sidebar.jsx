import React from 'react';

const Sidebar = ({ isAdmin, view, setView, navigate, user, handleLogout }) => (
  <aside className="w-72 bg-slate-950 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-2xl">
    <div className="p-10 flex items-center gap-4">
      <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg rotate-3">SX</div>
      <span className="text-white font-black text-2xl tracking-tighter italic">STEELX</span>
    </div>
    <nav className="flex-1 px-6 space-y-3">
      <div className="text-[10px] text-slate-600 uppercase font-black px-4 mb-4 tracking-[0.2em]">Logistics</div>
      {[{id:"overview", l:"Dashboard", i:"📊"}, {id:"catalog", l:"Catalog", i:"📦"}, {id:"cart", l:"My Cart", i:"🛒"}, {id:"orders", l:"Orders", i:"📝"}].map(s => (
        <button key={s.id} onClick={() => { setView(s.id); navigate("/"); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-[20px] font-bold transition-all ${view === s.id ? "bg-blue-600 text-white shadow-xl translate-x-2" : "hover:bg-slate-900"}`}>
          <span className="text-xl">{s.i}</span> {s.l}
        </button>
      ))}
      {isAdmin && (
        <>
          <div className="pt-8 mt-8 border-t border-slate-900 text-[10px] text-slate-600 uppercase font-black px-4 mb-4 tracking-[0.2em]">Admin</div>
          <button onClick={() => navigate('/staff-orders')} className="w-full flex items-center gap-4 px-5 py-4 rounded-[20px] font-bold text-rose-400 hover:bg-rose-500/10 transition-all">📋 Pipeline</button>
          <button onClick={() => navigate('/products')} className="w-full flex items-center gap-4 px-5 py-4 rounded-[20px] font-bold text-emerald-400 hover:bg-emerald-500/10 transition-all">🏷️ Products</button>
          <button onClick={() => navigate('/inventory')} className="w-full flex items-center gap-4 px-5 py-4 rounded-[20px] font-bold text-orange-400 hover:bg-orange-500/10 transition-all">📦 Inventory</button>
        </>
      )}
    </nav>
    <div className="p-6 bg-slate-900/30 border-t border-slate-900">
      <div className="px-4 py-3 bg-slate-900/50 rounded-2xl mb-4 border border-slate-800">
         <p className="text-[10px] text-slate-500 uppercase font-black mb-1 italic">{user?.role} Auth</p>
         <p className="text-sm font-black text-white truncate uppercase">{user?.name}</p>
      </div>
      <button onClick={handleLogout} className="w-full py-4 text-xs font-black text-rose-500 hover:bg-rose-600 hover:text-white rounded-2xl transition-all border-2 border-rose-500/20 uppercase">Logout</button>
    </div>
  </aside>
);
export default Sidebar;