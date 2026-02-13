import { useState, useContext } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const { login } = useContext(AuthContext);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const sendOTP = async () => {
    try {
      await API.post("/auth/send-otp", { phone });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "OTP Failed");
    }
  };

  const verifyOTP = async () => {
    try {
      const res = await API.post("/auth/verify-otp", { phone, otp });
      login(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-6 rounded shadow w-80">

        <h2 className="text-xl font-bold mb-4 text-center">
          SteelX Login
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 mb-2">
            {error}
          </div>
        )}

        {step === 1 ? (
          <>
            <input
              placeholder="Phone"
              className="border p-2 w-full mb-3"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button
              onClick={sendOTP}
              className="bg-black text-white w-full p-2"
            >
              Send OTP
            </button>
          </>
        ) : (
          <>
            <input
              placeholder="Enter OTP"
              className="border p-2 w-full mb-3"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              onClick={verifyOTP}
              className="bg-black text-white w-full p-2"
            >
              Verify OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
}
