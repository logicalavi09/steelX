import { apiRequest } from "../lib/api";

// Backend route /api/branches se match kiya
export const getBranches = (token) => 
  apiRequest("/api/branches", { token });

export const createBranch = (data, token) => 
  apiRequest("/api/branches", { method: "POST", body: data, token });