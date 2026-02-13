import { apiRequest } from "../lib/api";

export const getProducts = (token) => 
  apiRequest("/api/products", { token });

export const createProduct = (data, token) => 
  apiRequest("/api/products", { method: "POST", body: data, token });