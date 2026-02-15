import React from 'react';

const LoginScreen = ({ authPhone, setAuthPhone, authName, setAuthName, authOtp, setAuthOtp, otpSent, setOtpSent, loading, handleSendOtp, handleVerifyOtp }) => (
  <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900">
    <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl p-10 rounded-[40px] shadow-2xl border border-slate-700/50 relative overflow-hidden">
      <div className="text-center mb-10">
        <div className="h-20 w-20 bg-blue-600 rounded-[24px] mx-auto flex items-center justify-center text-white text-4xl font-black mb-6 shadow-blue-500/40 rotate-3">SX</div>
        <h2 className="text-3xl font-black text-white tracking-tight">SteelX Access</h2>
        <p className="text-slate-400 text-sm mt-2 font-medium">Industrial Supply Chain Portal</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Phone Number</label>
          <input disabled={otpSent} className="w-full px-6 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50" placeholder="+91 00000 00000" value={authPhone} onChange={e=>setAuthPhone(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Full Name</label>
          <input disabled={otpSent} className="w-full px-6 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50" placeholder="Enter full name" value={authName} onChange={e=>setAuthName(e.target.value)} />
        </div>

        {otpSent && (
          <div className="space-y-1 animate-in slide-in-from-bottom-4 duration-500">
            <label className="text-[10px] font-black text-blue-400 uppercase ml-4 tracking-widest">Verification Code</label>
            <input className="w-full px-6 py-4 bg-blue-900/20 border-2 border-blue-500/50 rounded-2xl text-white text-center text-3xl font-black outline-none shadow-lg" placeholder="0000" value={authOtp} onChange={e=>setAuthOtp(e.target.value)} />
          </div>
        )}

        <button 
          onClick={otpSent ? handleVerifyOtp : handleSendOtp}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black text-white transition-all transform active:scale-95 shadow-xl shadow-blue-500/20 mt-4"
        >
          {loading ? "Processing..." : otpSent ? "Unlock Access" : "Secure Entry"}
        </button>

        {otpSent && (
          <button onClick={() => setOtpSent(false)} className="w-full text-slate-500 text-xs font-bold mt-4 hover:text-white transition">← Change Details</button>
        )}
      </div>
    </div>
  </div>
);

export default LoginScreen;