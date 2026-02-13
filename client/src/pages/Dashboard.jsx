import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold">
        Welcome {user?.name}
      </h1>

      <p className="mt-2">
        Role: {user?.role}
      </p>

      <button
        onClick={logout}
        className="mt-4 bg-red-500 text-white px-4 py-2"
      >
        Logout
      </button>

    </div>
  );
}
