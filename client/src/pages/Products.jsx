import { useEffect, useState } from "react";
import { getProducts } from "../api/productAPI";
import ProductForm from "../components/ProductForm";
import ProductTable from "../components/ProductTable";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("steelx_token");

  const fetchProducts = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getProducts(token);
      setProducts(res); 
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900">Inventory Management</h2>
        <p className="text-slate-500 mt-2">Manage products and pricing on Port 5010.</p>
      </header>
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
           <ProductForm refresh={fetchProducts} />
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
           {loading ? <p className="text-center py-10">Loading inventory...</p> : <ProductTable products={products} />}
        </div>
      </div>
    </div>
  );
}