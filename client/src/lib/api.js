const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5010";

export const apiRequest = async (path, { method = "GET", body, token } = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = {};
    }
  }

  if (!res.ok) {
    const message = data?.message || data?.error || "Request failed";
    throw new Error(message);
  }

  return data;
};

export const downloadInvoice = async (orderId, token) => {
  const res = await fetch(`${API_BASE}/api/invoice/${orderId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!res.ok) {
    const text = await res.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = {};
      }
    }
    const message = data?.message || data?.error || "Unable to fetch invoice";
    throw new Error(message);
  }

  return res.blob();
};

export default API_BASE;
