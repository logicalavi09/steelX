import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("steelx_token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("steelx_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (tokenValue, userValue) => {
    setToken(tokenValue);
    setUser(userValue);
    localStorage.setItem("steelx_token", tokenValue);
    localStorage.setItem("steelx_user", JSON.stringify(userValue));
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("steelx_token");
    localStorage.removeItem("steelx_user");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);