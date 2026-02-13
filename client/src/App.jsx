import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import OrderChat from "./pages/OrderChat";
import API_BASE, { apiRequest, downloadInvoice } from "./lib/api";
import socket from "./services/socket";
import Branches from "./pages/Branches";
import Products from "./pages/Products";
import ProtectedRoute from "./routes/ProtectedRoute";

// --- HELPERS ---
const formatINR = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);

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

  // Form States
  const [authPhone, setAuthPhone] = useState("");
  const [authName, setAuthName] = useState("");
  const [authOtp, setAuthOtp] = useState("");

  // Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productSearch, setProductSearch] = useState("");

  const role = user?.role || "customer";
  const isStaff = role === "staff" || role === "admin";

  const sections = useMemo(() => [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "catalog", label: "Catalog", icon: "📦" },
    { id: "cart", label: "My Cart", icon: "🛒" },
    { id: "orders", label: "Orders", icon: "📝" },
  ], []);

  useEffect(() => {
    if (!token) return;
    refreshData();
  }, [token]);

  const refreshData = async () => {
    try {
      const p = await apiRequest("/api/products", { token });
      const o = await apiRequest(isStaff ? "/api/orders" : "/api/orders/my", { token });
      setProducts(p);
      setOrders(o);
    } catch (e) { showNotice(e.message, "error"); }
  };

  const showNotice = (message, type = "info") => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3000);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken("");
    setUser(null);
    navigate("/");
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

  // --- SUB-COMPONENTS ---

  const Sidebar = () => (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800">
      <div className="p-8 flex items-center gap-3">
        <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">SX</div>
        <span className="text-white font-bold text-xl tracking-tight">SteelX Pro</span>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => { setView(s.id); navigate("/"); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${view === s.id ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
        <div className="pt-4 mt-4 border-t border-slate-800 opacity-50 text-[10px] uppercase font-bold px-4 tracking-widest text-slate-500">Management</div>
        <button onClick={() => navigate('/products')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium hover:bg-slate-800 text-emerald-400">🏷️ Products</button>
        <button onClick={() => navigate('/branches')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium hover:bg-slate-800 text-blue-400">🏢 Branches</button>
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="px-4 py-2 bg-slate-800/50 rounded-xl mb-4">
          <p className="text-[10px] text-slate-500 uppercase font-black">Logged in as</p>
          <p className="text-sm font-bold text-white truncate uppercase">{user?.name || 'User'}</p>
        </div>
        <button onClick={handleLogout} className="w-full py-2 text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg transition">Logout</button>
      </div>
    </aside>
  );

  const LoginScreen = () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 p-10 rounded-[32px] shadow-2xl border border-slate-700">
        <div className="text-center mb-10">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4">SX</div>
          <h2 className="text-2xl font-bold text-white">SteelX Admin Access</h2>
        </div>
        <div className="space-y-4">
          <input className="w-full px-5 py-4 bg-slate-900 border-none rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone Number" value={authPhone} onChange={e=>setAuthPhone(e.target.value)} />
          <input className="w-full px-5 py-4 bg-slate-900 border-none rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full Name" value={authName} onChange={e=>setAuthName(e.target.value)} />
          {otpSent && <input className="w-full px-5 py-4 bg-blue-900/30 border-2 border-blue-500/30 rounded-2xl text-white text-center text-2xl font-bold" placeholder="0000" value={authOtp} onChange={e=>setAuthOtp(e.target.value)} />}
          <button onClick={otpSent ? async () => {
            try {
              const data = await apiRequest("/api/auth/verify-otp", { method: "POST", body: { phone: authPhone, otp: authOtp } });
              setToken(data.token); setUser(data.user);
              localStorage.setItem("steelx_token", data.token);
              localStorage.setItem("steelx_user", JSON.stringify(data.user));
            } catch(e) { showNotice(e.message, "error"); }
          } : async () => {
            try {
              await apiRequest("/api/auth/send-otp", { method: "POST", body: { phone: authPhone, name: authName } });
              setOtpSent(true); showNotice("OTP Sent");
            } catch(e) { showNotice(e.message, "error"); }
          }} className="w-full bg-blue-600 py-4 rounded-2xl font-bold text-white hover:bg-blue-500 transition">
            {otpSent ? "Verify" : "Send OTP"}
          </button>
        </div>
      </div>
    </div>
  );

  const DashboardContent = () => (
    <div className="animate-fade-in">
      {view === "overview" && (
        <div className="space-y-8">
          <h2 className="text-3xl font-black text-slate-900">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Active Orders</p>
               <p className="text-4xl font-black mt-2">{orders.length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Catalog Items</p>
               <p className="text-4xl font-black mt-2">{products.length}</p>
            </div>
          </div>
        </div>
      )}

      {view === "catalog" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-slate-900">Material Catalog</h2>
            <input className="px-4 py-2 rounded-xl border-none shadow-sm bg-white" placeholder="Search..." onChange={e=>setProductSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.filter(p=>p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
              <div key={p._id} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:shadow-xl transition group">
                <h3 className="font-bold text-slate-900 text-lg">{p.name}</h3>
                <p className="text-2xl font-black text-blue-600 mt-2">{formatINR(p.basePrice)}</p>
                <button onClick={() => { updateCart(p, 1); showNotice("Added to cart"); }} className="w-full mt-4 bg-slate-900 text-white py-2 rounded-xl font-bold">Add to Cart</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- CART VIEW LOGIC --- */}
      {view === "cart" && (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900">Shopping Cart</h2>
            <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-xs font-bold">{cart.length} Items</span>
          </div>
          <div className="p-8 space-y-4 max-h-[500px] overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-center py-10 text-slate-400 font-medium">Your cart is empty. Go to Catalog to add items.</p>
            ) : (
              cart.map(item => (
                <div key={item.product._id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-black text-slate-900">{item.product.name}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase">{formatINR(item.product.basePrice)} / unit</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm border">
                      <button onClick={()=>updateCart(item.product, -1)} className="w-8 h-8 flex items-center justify-center font-bold text-slate-400 hover:text-rose-500 transition">-</button>
                      <span className="w-6 text-center font-black text-slate-900">{item.quantity}</span>
                      <button onClick={()=>updateCart(item.product, 1)} className="w-8 h-8 flex items-center justify-center font-bold text-blue-600 hover:scale-125 transition">+</button>
                    </div>
                    <p className="font-black text-lg w-24 text-right">{formatINR(item.product.basePrice * item.quantity)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Amount</p>
                <p className="text-3xl font-black">{formatINR(cart.reduce((s,i)=>s+i.product.basePrice*i.quantity, 0))}</p>
              </div>
              <button 
                onClick={async () => {
                  try {
                    const items = cart.map(i => ({ productId: i.product._id, quantity: i.quantity }));
                    await apiRequest("/api/orders", { method: "POST", body: { items }, token });
                    setCart([]); setView("orders"); showNotice("Order Placed!", "success");
                    refreshData();
                  } catch(e) { showNotice(e.message, "error"); }
                }}
                className="bg-blue-600 hover:bg-blue-500 px-10 py-4 rounded-2xl font-bold text-lg transition shadow-lg shadow-blue-500/20"
              >
                Place Order Now 🚀
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- ORDERS VIEW LOGIC --- */}
      {view === "orders" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 h-[calc(100vh-160px)]">
          <div className="space-y-4 overflow-y-auto pr-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Order History</h2>
            {orders.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl text-center text-slate-400">No orders found yet.</div>
            ) : (
              orders.map(o => (
                <div 
                  key={o._id} 
                  onClick={()=>setSelectedOrder(o)} 
                  className={`p-6 rounded-[24px] border transition-all cursor-pointer ${selectedOrder?._id === o._id ? "bg-white border-blue-500 shadow-xl scale-[1.02]" : "bg-white border-slate-100 hover:border-slate-300"}`}
                >
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest">#{o._id.slice(-6)}</p>
                        <p className="text-slate-400 text-xs mt-1 font-bold">{new Date(o.createdAt).toLocaleString()}</p>
                     </div>
                     <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{o.status}</span>
                  </div>
                  <div className="mt-6 flex justify-between items-end">
                    <p className="font-bold text-slate-700 text-sm">{o.items?.length} Items in package</p>
                    <p className="text-2xl font-black text-slate-900">{formatINR(o.totalAmount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl p-6 flex flex-col h-full overflow-hidden">
             {selectedOrder ? (
               <>
                 <header className="border-b pb-4 mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-slate-900">Order Chat</h3>
                      <p className="text-[10px] text-slate-400 font-bold">SUPPORT ID: {selectedOrder._id.slice(-6)}</p>
                    </div>
                    <button onClick={()=>downloadInvoice(selectedOrder._id, token).then(b=>window.open(URL.createObjectURL(b)))} className="text-[10px] bg-slate-900 text-white px-3 py-2 rounded-xl font-bold hover:bg-black transition">Invoice ⬇</button>
                 </header>
                 <div className="flex-1 overflow-hidden">
                    <OrderChat orderId={selectedOrder._id} sender={user?.name} />
                 </div>
               </>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-10">
                 <div className="text-5xl mb-4 opacity-20">💬</div>
                 <p className="font-bold text-slate-400">Select an order from the list to start a real-time support chat with the agent.</p>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );

  const MainLayout = ({ children }) => (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-10 max-w-6xl mx-auto overflow-y-auto h-screen">{children}</main>
      {notice && (
        <div className={`fixed bottom-10 right-10 px-6 py-4 rounded-2xl text-white font-bold shadow-2xl animate-bounce ${notice.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
          {notice.message}
        </div>
      )}
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={!token ? <LoginScreen /> : <MainLayout><DashboardContent /></MainLayout>} />
      <Route path="/branches" element={<ProtectedRoute><MainLayout><Branches /></MainLayout></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><MainLayout><Products /></MainLayout></ProtectedRoute>} />
    </Routes>
  );
}