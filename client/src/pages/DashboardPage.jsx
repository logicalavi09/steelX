import React from 'react';
import OrderChat from "./OrderChat";
import { downloadInvoice } from "../lib/api";

const formatINR = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);

const DashboardPage = ({ view, user, orders, products, productSearch, setProductSearch, updateCart, showNotice, cart, setSelectedOrder, selectedOrder, handleCheckout, token }) => (
  <div className="space-y-10 animate-in fade-in duration-700">
    {view === "overview" && (
      <>
        <header><h2 className="text-5xl font-black text-slate-900 tracking-tighter">System Health</h2></header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white p-12 rounded-[56px] shadow-2xl border flex items-center gap-10">
             <div className="h-28 w-28 bg-blue-100 rounded-[40px] flex items-center justify-center text-6xl">📦</div>
             <div><p className="text-slate-400 text-sm font-black uppercase">Orders</p><p className="text-7xl font-black text-slate-900">{orders.length}</p></div>
          </div>
          <div className="bg-white p-12 rounded-[56px] shadow-2xl border flex items-center gap-10">
             <div className="h-28 w-28 bg-emerald-100 rounded-[40px] flex items-center justify-center text-6xl">📋</div>
             <div><p className="text-slate-400 text-sm font-black uppercase">SKUs</p><p className="text-7xl font-black text-slate-900">{products.length}</p></div>
          </div>
        </div>
      </>
    )}

    {view === "catalog" && (
      <div className="space-y-10">
        <div className="flex justify-between items-end"><h2 className="text-5xl font-black text-slate-900 tracking-tighter">Catalog</h2><input className="px-8 py-5 rounded-3xl shadow-2xl bg-white w-96 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="Search materials..." onChange={e=>setProductSearch(e.target.value)} /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {products.filter(p=>p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
            <div key={p._id} className="bg-white p-10 rounded-[48px] border hover:shadow-2xl transition group relative overflow-hidden">
              <h3 className="font-black text-slate-900 text-3xl group-hover:text-blue-600 transition tracking-tighter">{p.name}</h3>
              <p className="text-4xl font-black text-slate-900 mt-6 font-mono tracking-tighter">{formatINR(p.basePrice)}</p>
              <button onClick={() => { updateCart(p, 1); showNotice("Added to Cart"); }} className="w-full mt-10 bg-slate-950 text-white py-6 rounded-[30px] font-black hover:bg-blue-600 transition active:scale-95 uppercase tracking-widest text-sm">Add to procurement</button>
            </div>
          ))}
        </div>
      </div>
    )}

    {view === "cart" && (
       <div className="bg-white rounded-[64px] shadow-2xl border overflow-hidden max-w-6xl mx-auto">
          <div className="p-16 border-b bg-slate-50/50 flex justify-between items-center"><h2 className="text-5xl font-black text-slate-900 font-mono italic">INDUSTRIAL CART</h2><span className="bg-blue-600 text-white px-8 py-3 rounded-full text-sm font-black uppercase tracking-[0.2em]">{cart.length} LINE ITEMS</span></div>
          <div className="p-16 space-y-10">
             {cart.length === 0 ? <p className="text-center py-24 text-slate-300 font-black text-2xl uppercase tracking-[0.3em] border-4 border-dashed rounded-[48px]">Empty Container</p> : cart.map(item => (
               <div key={item.product._id} className="flex items-center justify-between p-12 bg-white rounded-[48px] border shadow-sm">
                 <div><p className="font-black text-slate-900 text-4xl tracking-tighter mb-2">{item.product.name}</p></div>
                 <div className="flex items-center gap-14">
                    <div className="flex items-center gap-8 bg-slate-100 rounded-[35px] p-4 border">
                      <button onClick={()=>updateCart(item.product, -1)} className="w-16 h-16 rounded-3xl bg-white shadow-md flex items-center justify-center font-black text-3xl hover:text-rose-600 transition">-</button>
                      <span className="w-14 text-center font-black text-5xl tracking-tighter">{item.quantity}</span>
                      <button onClick={()=>updateCart(item.product, 1)} className="w-16 h-16 rounded-3xl bg-white shadow-md flex items-center justify-center font-black text-3xl hover:text-blue-600 transition">+</button>
                    </div>
                    <p className="font-black text-5xl w-72 text-right font-mono tracking-tighter text-blue-600">{formatINR(item.product.basePrice * item.quantity)}</p>
                 </div>
               </div>
             ))}
          </div>
          {cart.length > 0 && (
             <div className="p-16 bg-slate-950 text-white flex justify-between items-center">
               <p className="text-7xl font-black font-mono tracking-tighter">{formatINR(cart.reduce((s,i)=>s+i.product.basePrice*i.quantity, 0))}</p>
               <button onClick={handleCheckout} className="bg-blue-600 hover:bg-blue-500 px-24 py-10 rounded-[40px] font-black text-4xl shadow-2xl active:scale-95 uppercase tracking-tighter italic">Secure Checkout 💳</button>
             </div>
          )}
       </div>
    )}

    {view === "orders" && (
       <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 h-[calc(100vh-180px)]">
          <div className="space-y-8 overflow-y-auto pr-8">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">Shipment Logs</h2>
            {orders.map(o => (
              <div key={o._id} onClick={()=>setSelectedOrder(o)} className={`p-12 rounded-[56px] border transition-all duration-500 cursor-pointer ${selectedOrder?._id === o._id ? "bg-white border-blue-500 shadow-2xl scale-[1.03]" : "bg-white shadow-md"}`}>
                <div className="flex justify-between items-start">
                   <p className="text-[12px] font-black text-blue-600 uppercase tracking-[0.4em]">UID: {o._id.slice(-10)}</p>
                   <span className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{o.status}</span>
                </div>
                <p className="text-6xl font-black text-slate-900 mt-12 font-mono tracking-tighter">{formatINR(o.totalAmount)}</p>
                <button onClick={(e)=>{e.stopPropagation(); downloadInvoice(o._id, token).then(b=>window.open(URL.createObjectURL(b)))}} className="mt-10 text-sm font-black text-blue-600 border-b-4 border-blue-600/20 hover:border-blue-600 transition-all uppercase tracking-widest">Download Invoice ⬇</button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[64px] border shadow-2xl p-12 flex flex-col h-full overflow-hidden">
             {selectedOrder ? <div className="flex-1 overflow-hidden rounded-[48px] bg-slate-50 p-10 border shadow-inner"><OrderChat orderId={selectedOrder._id} sender={user?.name} /></div> : <div className="h-full flex flex-col items-center justify-center text-slate-400">Select an entry</div>}
          </div>
       </div>
    )}
  </div>
);
export default DashboardPage;