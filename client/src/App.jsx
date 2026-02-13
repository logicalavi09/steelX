import { useEffect, useMemo, useState } from "react";
import OrderChat from "./pages/OrderChat";
import API_BASE, { apiRequest, downloadInvoice } from "./lib/api";
import socket from "./services/socket";

const STATUS_OPTIONS = ["pending", "paid", "processing", "ready", "delivered"];

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : "";

const initialProductForm = {
  name: "",
  category: "steel",
  unit: "piece",
  basePrice: "",
  description: ""
};

const initialBranchForm = {
  name: "",
  address: "",
  phone: ""
};

const initialStockForm = {
  branchId: "",
  productId: "",
  stock: ""
};

export default function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem("steelx_token") || ""
  );
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("steelx_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const [authPhone, setAuthPhone] = useState("");
  const [authName, setAuthName] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [view, setView] = useState("overview");

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [productSearch, setProductSearch] = useState("");
  const [branches, setBranches] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [productForm, setProductForm] = useState(initialProductForm);
  const [branchForm, setBranchForm] = useState(initialBranchForm);
  const [stockForm, setStockForm] = useState(initialStockForm);

  const role = user?.role || "customer";
  const isStaff = role === "staff" || role === "admin";
  const isAdmin = role === "admin";

  const sections = useMemo(() => {
    const base = [
      { id: "overview", label: "Overview" },
      { id: "catalog", label: "Catalog" },
      { id: "cart", label: "Cart" },
      { id: "orders", label: "Orders" }
    ];

    if (isStaff || role === "admin") {
      base.push({ id: "operations", label: "Operations" });
    }

    return base;
  }, [isStaff, role]);

  useEffect(() => {
    if (!token) return;
    refreshProducts();
    refreshOrders();
    if (isStaff || role === "admin") {
      refreshBranches();
    }
  }, [token, isStaff, role]);

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  const updateStorage = (tokenValue, userValue) => {
    if (tokenValue) {
      localStorage.setItem("steelx_token", tokenValue);
    } else {
      localStorage.removeItem("steelx_token");
    }

    if (userValue) {
      localStorage.setItem("steelx_user", JSON.stringify(userValue));
    } else {
      localStorage.removeItem("steelx_user");
    }
  };

  const showNotice = (message, type = "info") => {
    setNotice({ message, type });
  };

  const refreshProducts = async () => {
    try {
      const data = await apiRequest("/api/products", { token });
      setProducts(data);
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const refreshOrders = async () => {
    try {
      const endpoint = isStaff ? "/api/orders" : "/api/orders/my";
      const data = await apiRequest(endpoint, { token });
      setOrders(data);
      return data;
    } catch (error) {
      showNotice(error.message, "error");
      return [];
    }
  };

  const refreshBranches = async () => {
    try {
      const data = await apiRequest("/api/branches", { token });
      setBranches(data);
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const refreshInventory = async (branchId) => {
    try {
      if (!branchId) return;
      const data = await apiRequest(`/api/inventory/${branchId}`, { token });
      setInventory(data);
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleSendOtp = async () => {
    if (!authPhone.trim()) {
      showNotice("Phone number is required", "error");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/auth/send-otp", {
        method: "POST",
        body: { phone: authPhone.trim(), name: authName.trim() },
        token: ""
      });
      setOtpSent(true);
      showNotice("OTP sent. Check backend logs for the test OTP.", "success");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!authOtp.trim()) {
      showNotice("OTP is required", "error");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/verify-otp", {
        method: "POST",
        body: { phone: authPhone.trim(), otp: authOtp.trim() },
        token: ""
      });

      setToken(data.token);
      setUser(data.user);
      updateStorage(data.token, data.user);
      showNotice(`Welcome back, ${data.user.name || "SteelX User"}!`, "success");
      setAuthOtp("");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    setOrders([]);
    setProducts([]);
    setCart([]);
    setSelectedOrder(null);
    updateStorage("", null);
    setView("overview");
  };

  const updateCart = (product, delta) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (!existing && delta > 0) {
        return [...prev, { product, quantity: delta }];
      }
      if (!existing) return prev;

      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter((item) => item.product._id !== product._id);
      }

      return prev.map((item) =>
        item.product._id === product._id ? { ...item, quantity: nextQty } : item
      );
    });
  };

  const cartTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.product.basePrice * item.quantity, 0),
  [cart]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      showNotice("Add items before placing an order", "error");
      return;
    }

    setLoading(true);
    try {
      const items = cart.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity
      }));
      const order = await apiRequest("/api/orders", {
        method: "POST",
        body: { items },
        token
      });

      setCart([]);
      const latestOrders = await refreshOrders();
      const updatedOrder = latestOrders.find((item) => item._id === order._id);
      setSelectedOrder(updatedOrder || order);
      showNotice("Order created and assigned to a branch", "success");
      setView("orders");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (orderId) => {
    setLoading(true);
    try {
      const payment = await apiRequest("/api/payments/create", {
        method: "POST",
        body: { orderId },
        token
      });
      showNotice(`Payment order created: ${payment.id}`, "success");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInvoice = async (orderId) => {
    try {
      const blob = await downloadInvoice(orderId, token);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      const updated = await apiRequest("/api/orders/status", {
        method: "PUT",
        body: { orderId, status },
        token
      });
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? updated : order))
      );
      if (!socket.connected) socket.connect();
      socket.emit("orderStatusUpdate", { orderId, status });
      showNotice("Order status updated", "success");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleCreateProduct = async () => {
    if (!productForm.name.trim() || !productForm.basePrice) {
      showNotice("Product name and price are required", "error");
      return;
    }

    try {
      const payload = {
        ...productForm,
        basePrice: Number(productForm.basePrice)
      };
      await apiRequest("/api/products", {
        method: "POST",
        body: payload,
        token
      });
      setProductForm(initialProductForm);
      await refreshProducts();
      showNotice("Product created", "success");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleCreateBranch = async () => {
    if (!branchForm.name.trim() || !branchForm.address.trim()) {
      showNotice("Branch name and address are required", "error");
      return;
    }

    try {
      await apiRequest("/api/branches", {
        method: "POST",
        body: branchForm,
        token
      });
      setBranchForm(initialBranchForm);
      await refreshBranches();
      showNotice("Branch created", "success");
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const handleUpdateStock = async () => {
    if (!stockForm.branchId || !stockForm.productId || stockForm.stock === "") {
      showNotice("Select branch, product, and stock level", "error");
      return;
    }

    try {
      await apiRequest("/api/inventory/update", {
        method: "POST",
        body: {
          branchId: stockForm.branchId,
          productId: stockForm.productId,
          stock: Number(stockForm.stock)
        },
        token
      });
      showNotice("Inventory updated", "success");
      await refreshInventory(stockForm.branchId);
      setStockForm((prev) => ({ ...prev, stock: "" }));
    } catch (error) {
      showNotice(error.message, "error");
    }
  };

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      [product.name, product.category, product.unit]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [productSearch, products]);

  if (!token) {
    return (
      <div className="min-h-screen px-6 pb-16 pt-10 text-slate-900">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
              SX
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                SteelX
              </p>
              <h1 className="text-lg font-semibold">Command Center</h1>
            </div>
          </div>
          <span className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            Industrial ordering, simplified
          </span>
        </header>

        <main className="mx-auto mt-12 grid w-full max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <p className="text-xs uppercase tracking-[0.5em] text-slate-500">
              Fabrication Intelligence
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
              Orchestrate steel supply, orders, and fulfillment in one unified
              cockpit.
            </h2>
            <p className="mt-6 max-w-xl text-base text-slate-600">
              SteelX Pro keeps your teams synced across branches, inventory, and
              customer delivery. Track fabrication status, collaborate in real
              time, and generate invoices without leaving the dashboard.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Live ops",
                  value: "Realtime",
                  desc: "Chat + status events"
                },
                { label: "Coverage", value: "Multi-branch", desc: "Auto assign" },
                { label: "Payments", value: "Razorpay", desc: "Invoice-ready" }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                OTP-based login
              </span>
              <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900">
                Branch-aware pricing
              </span>
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-800">
                PDF invoices with QR
              </span>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                  Secure Access
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  Sign in with OTP
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {otpSent ? "Verify" : "Send"}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Phone number
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
                  placeholder="+91 98765 43210"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Name (first time only)
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
                  placeholder="Aman Steelworks"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                />
              </label>

              {otpSent && (
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  One time password
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-slate-400"
                    placeholder="Enter OTP"
                    value={authOtp}
                    onChange={(e) => setAuthOtp(e.target.value)}
                  />
                </label>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading && !otpSent ? "Sending..." : "Send OTP"}
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={loading || !otpSent}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:opacity-60"
              >
                {loading && otpSent ? "Verifying..." : "Verify"}
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-xs text-slate-500">
              Test OTP is printed in backend console logs. Switch to your
              terminal and copy it here to continue.
            </div>
          </section>
        </main>

        <footer className="mx-auto mt-16 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>SteelX Pro • Supply chain ops suite</span>
          <span>Backend: {API_BASE.replace("http://", "").replace("https://", "")}</span>
        </footer>

        {notice && (
          <div
            className={`fixed bottom-6 right-6 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg ${
              notice.type === "error"
                ? "bg-rose-600 text-white"
                : "bg-emerald-600 text-white"
            }`}
          >
            {notice.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pb-10 pt-8 text-slate-900">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
            SX
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
              SteelX
            </p>
            <h1 className="text-lg font-semibold">Operations Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            {user?.name || "SteelX User"} • {role.toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto mt-8 grid w-full max-w-7xl gap-6 xl:grid-cols-[240px_1fr]">
        <aside className="rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-sm">
          <p className="px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-400">
            Navigation
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setView(section.id)}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  view === section.id
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-xs text-slate-500">
            Need help? Visit <span className="font-semibold">/api/health</span>
            to confirm backend status.
          </div>
        </aside>

        <main className="space-y-6">
          {view === "overview" && (
            <section className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                    Overview
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Today’s flow
                  </h2>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    month: "short",
                    day: "numeric"
                  })}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  {
                    label: "Active orders",
                    value: orders.length,
                    hint: "Across all branches"
                  },
                  {
                    label: "Catalog items",
                    value: products.length,
                    hint: "Steel, aluminium, custom"
                  },
                  {
                    label: "Cart value",
                    value: formatINR(cartTotal),
                    hint: "Ready to place"
                  }
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-900 px-5 py-5 text-white">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                    Priority action
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">
                    Assemble a new steel order
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Add items to your cart, validate pricing, and submit to the
                    nearest branch. We’ll auto-assign based on availability.
                  </p>
                  <button
                    onClick={() => setView("catalog")}
                    className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900"
                  >
                    Browse catalog
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    System status
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Realtime chat</span>
                      <span className="text-emerald-600">Live</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Inventory sync</span>
                      <span className="text-emerald-600">Stable</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Invoices</span>
                      <span className="text-emerald-600">Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {view === "catalog" && (
            <section className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                    Catalog
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Products & materials
                  </h2>
                </div>
                <input
                  className="w-full max-w-xs rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
                  placeholder="Search products"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const inCart = cart.find(
                    (item) => item.product._id === product._id
                  );
                  return (
                    <div
                      key={product._id}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          {product.category}
                        </p>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {product.unit}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-slate-900">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {product.description ||
                          "Industrial-grade material certified for fabrication."}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-lg font-semibold text-slate-900">
                          {formatINR(product.basePrice)}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCart(product, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-700"
                          >
                            −
                          </button>
                          <span className="text-sm font-semibold text-slate-900">
                            {inCart?.quantity || 0}
                          </span>
                          <button
                            onClick={() => updateCart(product, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {view === "cart" && (
            <section className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                    Cart
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Build your order
                  </h2>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Placing..." : "Place Order"}
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {cart.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Your cart is empty. Add products from the catalog.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product._id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          {item.product.category}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {formatINR(item.product.basePrice)} per {item.product.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateCart(item.product, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-700"
                        >
                          −
                        </button>
                        <span className="text-sm font-semibold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCart(item.product, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          Line total
                        </p>
                        <p className="text-lg font-semibold text-slate-900">
                          {formatINR(item.product.basePrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Total payable
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {formatINR(cartTotal)}
                  </p>
                </div>
                <button
                  onClick={() => setView("catalog")}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Add more items
                </button>
              </div>
            </section>
          )}

          {view === "orders" && (
            <section className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                    Orders
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Track fulfillment
                  </h2>
                </div>
                <button
                  onClick={refreshOrders}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No orders yet. Place one from the cart.
                    </div>
                  ) : (
                    orders.map((order) => (
                      <button
                        key={order._id}
                        onClick={() => setSelectedOrder(order)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                          selectedOrder?._id === order._id
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] opacity-70">
                              Order
                            </p>
                            <h3 className="mt-1 text-lg font-semibold">
                              #{order._id.slice(-6)}
                            </h3>
                          </div>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                            {order.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm opacity-80">
                          {order.items?.length || 0} items • {formatINR(order.totalAmount)}
                        </p>
                        <p className="text-xs opacity-60">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </button>
                    ))
                  )}
                </div>

                <div className="space-y-4">
                  {selectedOrder ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            Order details
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-900">
                            #{selectedOrder._id.slice(-6)}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {formatDateTime(selectedOrder.createdAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                          {selectedOrder.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p>
                          Branch: <span className="font-semibold text-slate-900">
                            {selectedOrder.branch?.name || "Assigned soon"}
                          </span>
                        </p>
                        <p>
                          Amount: <span className="font-semibold text-slate-900">
                            {formatINR(selectedOrder.totalAmount)}
                          </span>
                        </p>
                      </div>

                      <div className="mt-4 space-y-2">
                        {(selectedOrder.items || []).map((item, index) => (
                          <div
                            key={`${selectedOrder._id}-${index}`}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                          >
                            <span>
                              {item.product?.name || "Product"} × {item.quantity}
                            </span>
                            <span className="font-semibold">
                              {formatINR(item.price)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleInvoice(selectedOrder._id)}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                        >
                          Download Invoice
                        </button>
                        {role === "customer" && (
                          <button
                            onClick={() => handleCreatePayment(selectedOrder._id)}
                            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                          >
                            Create Payment
                          </button>
                        )}
                      </div>

                      {isStaff && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            Update status
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((status) => (
                              <button
                                key={status}
                                onClick={() => handleStatusUpdate(selectedOrder._id, status)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400"
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Select an order to view details and chat.
                    </div>
                  )}

                  {selectedOrder && (
                    <OrderChat
                      orderId={selectedOrder._id}
                      sender={user?.name || "Agent"}
                    />
                  )}
                </div>
              </div>
            </section>
          )}

          {view === "operations" && (isStaff || role === "admin") && (
            <section className="rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                    Operations
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Admin controls
                  </h2>
                </div>
                <button
                  onClick={() => {
                    refreshProducts();
                    refreshBranches();
                  }}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Sync data
                </button>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {isAdmin && (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Create product
                    </p>
                    <div className="mt-3 space-y-2">
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Product name"
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            name: e.target.value
                          }))
                        }
                      />
                      <select
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            category: e.target.value
                          }))
                        }
                      >
                        <option value="steel">steel</option>
                        <option value="aluminium">aluminium</option>
                        <option value="custom">custom</option>
                      </select>
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Unit (kg / piece / meter)"
                        value={productForm.unit}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            unit: e.target.value
                          }))
                        }
                      />
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Base price"
                        value={productForm.basePrice}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            basePrice: e.target.value
                          }))
                        }
                      />
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Description"
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            description: e.target.value
                          }))
                        }
                      />
                      <button
                        onClick={handleCreateProduct}
                        className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Add product
                      </button>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Create branch
                    </p>
                    <div className="mt-3 space-y-2">
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Branch name"
                        value={branchForm.name}
                        onChange={(e) =>
                          setBranchForm((prev) => ({
                            ...prev,
                            name: e.target.value
                          }))
                        }
                      />
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Address"
                        value={branchForm.address}
                        onChange={(e) =>
                          setBranchForm((prev) => ({
                            ...prev,
                            address: e.target.value
                          }))
                        }
                      />
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Phone"
                        value={branchForm.phone}
                        onChange={(e) =>
                          setBranchForm((prev) => ({
                            ...prev,
                            phone: e.target.value
                          }))
                        }
                      />
                      <button
                        onClick={handleCreateBranch}
                        className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Add branch
                      </button>
                    </div>
                  </div>
                )}

                {!isAdmin && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    Admin-only actions (create products and branches) are hidden
                    for staff accounts.
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Update inventory
                  </p>
                  <div className="mt-3 space-y-2">
                    <select
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={stockForm.branchId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStockForm((prev) => ({ ...prev, branchId: value }));
                        refreshInventory(value);
                      }}
                    >
                      <option value="">Select branch</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={stockForm.productId}
                      onChange={(e) =>
                        setStockForm((prev) => ({
                          ...prev,
                          productId: e.target.value
                        }))
                      }
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Stock"
                      value={stockForm.stock}
                      onChange={(e) =>
                        setStockForm((prev) => ({ ...prev, stock: e.target.value }))
                      }
                    />
                    <button
                      onClick={handleUpdateStock}
                      className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Update stock
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Inventory snapshot
                </p>
                {inventory.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Select a branch to view inventory.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {inventory.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                      >
                        <div className="font-semibold text-slate-900">
                          {item.product?.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Stock: {item.stock}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      {notice && (
        <div
          className={`fixed bottom-6 right-6 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg ${
            notice.type === "error"
              ? "bg-rose-600 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {notice.message}
        </div>
      )}
    </div>
  );
}
