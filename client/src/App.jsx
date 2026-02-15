import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import OrderChat from "./pages/OrderChat";
import API_BASE, { apiRequest, downloadInvoice } from "./lib/api";
import { initiatePayment } from "./api/paymentAPI"; // Payment API
import socket from "./services/socket";
import Branches from "./pages/Branches";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import StaffOrders from "./pages/StaffOrders";
import ProtectedRoute from "./routes/ProtectedRoute";

const formatINR = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);

// --- HELPER: RAZORPAY SCRIPT LOADER ---
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// --- SUB-COMPONENTS ---

const Sidebar = ({ isAdmin, view, setView, navigate, user, handleLogout }) => (
  <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-2xl">
    <div className="p-8 flex items-center gap-3">
      <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">SX</div>
      <span className="text-white font-bold text-xl tracking-tight uppercase">SteelX {isAdmin ? 'Admin' : 'Pro'}</span>
    </div>
    <nav className="flex-1 px-4 space-y-2">
      <div className="text-[10px] text-slate-500 uppercase font-black px-4 mb-2 tracking-widest">Main Menu</div>
      {[
        { id: "overview", label: "Dashboard", icon: "📊" },
        { id: "catalog", label: "Catalog", icon: "📦" },
        { id: "cart", label: "My Cart", icon: "🛒" },
        { id: "orders", label: "Orders", icon: "📝" },
      ].map((s) => (
        <button key={s.id} onClick={() => { setView(s.id); navigate("/"); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === s.id ? "bg-blue-600 text-white shadow-lg" : "hover:bg-slate-800 hover:text-white"}`}>
          <span>{s.icon}</span> {s.label}
        </button>
      ))}
      {isAdmin && (
        <>
          <div className="pt-6 mt-6 border-t border-slate-800 text-[10px] text-slate-500 uppercase font-black px-4 mb-2 tracking-widest">Admin Control</div>
          <button onClick={() => navigate('/staff-orders')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold hover:bg-rose-500/10 text-rose-400">📋 Order Pipeline</button>
          <button onClick={() => navigate('/products')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold hover:bg-emerald-500/10 text-emerald-400">🏷️ Manage Products</button>
          <button onClick={() => navigate('/inventory')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold hover:bg-orange-500/10 text-orange-400">📦 Inventory</button>
          <button onClick={() => navigate('/branches')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold hover:bg-blue-500/10 text-blue-400">🏢 Manage Branches</button>
        </>
      )}
    </nav>
    <div className="p-4 border-t border-slate-800 text-center">
      <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">User: {user?.name}</p>
      <button onClick={handleLogout} className="w-full py-2 text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg transition border border-rose-500/20">Logout</button>
    </div>
  </aside>
);

const LoginScreen = ({ otpSent, authPhone, setAuthPhone, authName, setAuthName, authOtp, setAuthOtp, handleVerifyOtp, handleSendOtp, loading, setOtpSent }) => (
  <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900">
    <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl p-10 rounded-[40px] shadow-2xl border border-slate-700/50 relative overflow-hidden">
      <div className="text-center mb-10">
        <div className="h-20 w-20 bg-blue-600 rounded-[24px] mx-auto flex items-center justify-center text-white text-4xl font-black mb-6 rotate-3">SX</div>
        <h2 className="text-3xl font-black text-white">SteelX Access</h2>
      </div>
      <div className="space-y-4">
        <input disabled={otpSent} className="w-full px-6 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone Number" value={authPhone} onChange={e=>setAuthPhone(e.target.value)} />
        <input disabled={otpSent} className="w-full px-6 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full Name" value={authName} onChange={e=>setAuthName(e.target.value)} />
        {otpSent && <input className="w-full px-6 py-4 bg-blue-900/20 border-2 border-blue-500/50 rounded-2xl text-white text-center text-3xl font-black" placeholder="0000" value={authOtp} onChange={e=>setAuthOtp(e.target.value)} />}
        <button onClick={otpSent ? handleVerifyOtp : handleSendOtp} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black text-white transition active:scale-95 mt-4">{loading ? "Processing..." : otpSent ? "Unlock Access" : "Secure Entry"}</button>
        {otpSent && <button onClick={() => setOtpSent(false)} className="w-full text-slate-500 text-xs font-bold mt-4">← Change Details</button>}
      </div>
    </div>
  </div>
);

const DashboardContent = ({ view, user, orders, products, productSearch, setProductSearch, updateCart, showNotice, cart, token, refreshData, setSelectedOrder, selectedOrder, handleCheckout }) => (
  <div className="space-y-8 animate-in fade-in duration-700">
    {view === "overview" && (
      <>
        <header><h2 className="text-4xl font-black text-slate-900">Dashboard</h2><p className="text-slate-500 mt-2 font-medium">Welcome back, <span className="text-blue-600 font-bold">{user?.name}</span>.</p></header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex items-center gap-6">
             <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">📦</div>
             <div><p className="text-slate-500 text-xs font-black uppercase">Orders</p><p className="text-3xl font-black text-slate-900">{orders.length}</p></div>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex items-center gap-6">
             <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl">📋</div>
             <div><p className="text-slate-500 text-xs font-black uppercase">Catalog</p><p className="text-3xl font-black text-slate-900">{products.length}</p></div>
          </div>
        </div>
      </>
    )}

    {view === "catalog" && (
      <div className="space-y-8">
        <div className="flex justify-between items-end"><h2 className="text-4xl font-black text-slate-900">Catalog</h2><input className="px-6 py-3 rounded-2xl shadow-xl bg-white w-80 outline-none" placeholder="Search..." onChange={e=>setProductSearch(e.target.value)} /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.filter(p=>p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
            <div key={p._id} className="bg-white p-8 rounded-[32px] border border-slate-100 hover:shadow-2xl transition group relative overflow-hidden">
              <h3 className="font-black text-slate-900 text-xl group-hover:text-blue-600 transition">{p.name}</h3>
              <p className="text-3xl font-black text-slate-900 mt-4">{formatINR(p.basePrice)}</p>
              <button onClick={() => { updateCart(p, 1); showNotice("Added to cart"); }} className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-blue-600 transition shadow-lg">Add to Cart</button>
            </div>
          ))}
        </div>
      </div>
    )}

    {view === "cart" && (
       <div className="bg-white rounded-[40px] shadow-2xl border overflow-hidden max-w-4xl">
          <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center"><h2 className="text-3xl font-black text-slate-900">My Cart</h2></div>
          <div className="p-10 space-y-6">
             {cart.length === 0 ? <p className="text-center py-20 text-slate-400 font-bold">Your cart is empty.</p> : cart.map(item => (
               <div key={item.product._id} className="flex items-center justify-between p-6 bg-white rounded-3xl border shadow-sm">
                 <div><p className="font-black text-slate-900 text-lg">{item.product.name}</p></div>
                 <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4 bg-slate-100 rounded-2xl p-2 border">
                      <button onClick={()=>updateCart(item.product, -1)} className="w-10 h-10 font-black">-</button>
                      <span className="w-8 text-center font-black text-xl">{item.quantity}</span>
                      <button onClick={()=>updateCart(item.product, 1)} className="w-10 h-10 font-black">+</button>
                    </div>
                    <p className="font-black text-2xl w-32 text-right">{formatINR(item.product.basePrice * item.quantity)}</p>
                 </div>
               </div>
             ))}
          </div>
          {cart.length > 0 && (
             <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
               <p className="text-4xl font-black">{formatINR(cart.reduce((s,i)=>s+i.product.basePrice*i.quantity, 0))}</p>
               <button onClick={handleCheckout} className="bg-blue-600 hover:bg-blue-500 px-12 py-5 rounded-2xl font-black text-xl shadow-2xl">Secure Checkout 💳</button>
             </div>
          )}
       </div>
    )}

    {view === "orders" && (
       <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 h-[calc(100vh-180px)]">
          <div className="space-y-4 overflow-y-auto pr-4">
            <h2 className="text-3xl font-black text-slate-900 mb-8">Shipment Logs</h2>
            {orders.map(o => (
              <div key={o._id} onClick={()=>setSelectedOrder(o)} className={`p-8 rounded-[32px] border transition-all cursor-pointer ${selectedOrder?._id === o._id ? "bg-white border-blue-500 shadow-2xl scale-[1.02]" : "bg-white border-slate-100 hover:border-slate-300 shadow-sm"}`}>
                <div className="flex justify-between items-start">
                   <div><p className="text-xs font-black text-blue-600 uppercase">UID: {o._id.slice(-6)}</p></div>
                   <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{o.status}</span>
                </div>
                <p className="text-3xl font-black text-slate-900 mt-8">{formatINR(o.totalAmount)}</p>
                <button onClick={(e)=>{e.stopPropagation(); downloadInvoice(o._id, token).then(b=>window.open(URL.createObjectURL(b)))}} className="mt-4 text-[10px] font-black text-blue-600">DOWNLOAD INVOICE ⬇</button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[40px] border shadow-2xl p-8 flex flex-col h-full overflow-hidden">
             {selectedOrder ? (
               <div className="flex-1 overflow-hidden rounded-3xl bg-slate-50 p-4 border"><OrderChat orderId={selectedOrder._id} sender={user?.name} /></div>
             ) : <div className="h-full flex flex-col items-center justify-center text-slate-400">Select an order entry</div>}
          </div>
       </div>
    )}
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("steelx_token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("steelx_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("overview");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const [authPhone, setAuthPhone] = useState("");
  const [authName, setAuthName] = useState("");
  const [authOtp, setAuthOtp] = useState("");

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productSearch, setProductSearch] = useState("");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (token) refreshData();
  }, [token]);

  const refreshData = async () => {
    try {
      const p = await apiRequest("/api/products", { token });
      const o = await apiRequest(isAdmin ? "/api/orders" : "/api/orders/my", { token });
      setProducts(p);
      setOrders(o);
    } catch (e) { console.error(e); }
  };

  const showNotice = (message, type = "info") => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3000);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(""); setUser(null); setOtpSent(false); navigate("/");
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await apiRequest("/api/auth/send-otp", { method: "POST", body: { phone: authPhone, name: authName } });
      setOtpSent(true);
      showNotice("OTP Sent");
    } catch(e) { showNotice(e.message, "error"); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/verify-otp", { method: "POST", body: { phone: authPhone, otp: authOtp } });
      setToken(data.token); setUser(data.user);
      localStorage.setItem("steelx_token", data.token);
      localStorage.setItem("steelx_user", JSON.stringify(data.user));
    } catch(e) { showNotice(e.message, "error"); }
    finally { setLoading(false); }
  };

  // --- PAYMENT INTEGRATION LOGIC ---
  const handleCheckout = async () => {
    const res = await loadRazorpay();
    if (!res) return alert("Razorpay SDK failed to load. Check your internet.");

    try {
      setLoading(true);
      // 1. Order Create Karo
      const items = cart.map(i => ({ productId: i.product._id, quantity: i.quantity }));
      const order = await apiRequest("/api/orders", { method: "POST", body: { items }, token });

      // 2. Razorpay Order mangao backend se
      const paymentData = await initiatePayment(order._id, token);

      // 3. Razorpay Popup Open Karo
      const options = {
        key: paymentData.key || "rzp_test_YOUR_KEY_HERE", // Test Key
        amount: paymentData.amount,
        currency: "INR",
        name: "SteelX Pro",
        description: "Industrial Procurement",
        order_id: paymentData.id,
        handler: async (response) => {
          showNotice("Payment Successful! Dispatching order...", "success");
          setCart([]);
          setView("orders");
          refreshData();
        },
        prefill: { name: user.name, contact: user.phone },
        theme: { color: "#2563eb" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (e) {
      showNotice(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (product, delta) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.product._id === product._id);
      if (!ex && delta > 0) return [...prev, { product, quantity: delta }];
      if (!ex) return prev;
      const nQty = ex.quantity + delta;
      return nQty <= 0 ? prev.filter((i) => i.product._id !== product._id) : prev.map((i) => i.product._id === product._id ? { ...ex, quantity: nQty } : i);
    });
  };

  return (
    <Routes>
      <Route path="/" element={!token ? (
        <LoginScreen 
          authPhone={authPhone} setAuthPhone={setAuthPhone} authName={authName} setAuthName={setAuthName}
          authOtp={authOtp} setAuthOtp={setAuthOtp} otpSent={otpSent} setOtpSent={setOtpSent}
          loading={loading} handleSendOtp={handleSendOtp} handleVerifyOtp={handleVerifyOtp}
        />
      ) : (
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar isAdmin={isAdmin} view={view} setView={setView} navigate={navigate} user={user} handleLogout={handleLogout} />
          <main className="flex-1 p-12 max-w-[1400px] mx-auto overflow-y-auto h-screen">
            <DashboardContent 
              view={view} user={user} orders={orders} products={products} 
              productSearch={productSearch} setProductSearch={setProductSearch}
              updateCart={updateCart} showNotice={showNotice} cart={cart} token={token} 
              refreshData={refreshData} setSelectedOrder={setSelectedOrder} selectedOrder={selectedOrder}
              handleCheckout={handleCheckout}
            />
          </main>
          {notice && <div className={`fixed bottom-12 right-12 px-8 py-5 rounded-3xl text-white font-black shadow-2xl z-50 animate-bounce ${notice.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}`}>{notice.message}</div>}
        </div>
      )} />
      
      <Route path="/staff-orders" element={<ProtectedRoute><div className="flex min-h-screen bg-slate-50"><Sidebar isAdmin={isAdmin} view={view} setView={setView} navigate={navigate} user={user} handleLogout={handleLogout} /><main className="flex-1 p-12 max-w-[1400px] mx-auto h-screen overflow-y-auto"><StaffOrders /></main></div></ProtectedRoute>} />
      <Route path="/branches" element={<ProtectedRoute><div className="flex min-h-screen bg-slate-50"><Sidebar isAdmin={isAdmin} view={view} setView={setView} navigate={navigate} user={user} handleLogout={handleLogout} /><main className="flex-1 p-12 max-w-[1400px] mx-auto h-screen overflow-y-auto"><Branches /></main></div></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><div className="flex min-h-screen bg-slate-50"><Sidebar isAdmin={isAdmin} view={view} setView={setView} navigate={navigate} user={user} handleLogout={handleLogout} /><main className="flex-1 p-12 max-w-[1400px] mx-auto h-screen overflow-y-auto"><Products /></main></div></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><div className="flex min-h-screen bg-slate-50"><Sidebar isAdmin={isAdmin} view={view} setView={setView} navigate={navigate} user={user} handleLogout={handleLogout} /><main className="flex-1 p-12 max-w-[1400px] mx-auto h-screen overflow-y-auto"><Inventory /></main></div></ProtectedRoute>} />
    </Routes>
  );
}