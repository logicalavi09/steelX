import { apiRequest } from "../lib/api";

// Backend route se match kiya gaya
export const updateStock = (data, token) =>
  apiRequest("/api/inventory/update", { method: "POST", body: data, token });

export const getInventory = (branchId, token) =>
  apiRequest(`/api/inventory/${branchId}`, { token });