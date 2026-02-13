import { useEffect, useMemo, useState } from "react";
import socket from "../services/socket";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function OrderChat({ orderId, sender }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const displaySender = useMemo(() => sender || "Agent", [sender]);

  useEffect(() => {
    if (!orderId) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("joinOrderRoom", orderId);

    const handleReceive = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleStatus = (data) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "System",
          message: `Order status updated to ${data.status}`,
          time: data.time
        }
      ]);
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("statusUpdated", handleStatus);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("statusUpdated", handleStatus);
    };
  }, [orderId]);

  const sendMessage = () => {
    if (!message.trim() || !orderId) return;

    socket.emit("sendMessage", {
      orderId,
      message,
      sender: displaySender
    });

    setMessage("");
  };

  return (
    <div className="flex flex-col h-[420px] rounded-2xl border border-black/10 bg-white/80 shadow-[0_15px_60px_-40px_rgba(20,27,33,0.6)]">
      <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Live Order Room
          </p>
          <h2 className="text-lg font-semibold text-slate-900">
            #{orderId?.slice(-6)}
          </h2>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          Realtime
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Start the conversation to coordinate fabrication, delivery, and
            payment.
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={`${msg.sender}-${i}`}
              className={`flex ${msg.sender === displaySender ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.sender === displaySender
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                <div className="text-[11px] uppercase tracking-[0.25em] opacity-70">
                  {msg.sender}
                </div>
                <p className="mt-1 leading-relaxed">{msg.message}</p>
                {msg.time && (
                  <p className="mt-2 text-[11px] opacity-70">
                    {formatTime(msg.time)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-black/10 px-5 py-4">
        <input
          className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-slate-400"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message for the operations team..."
        />
        <button
          onClick={sendMessage}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Send
        </button>
      </div>
    </div>
  );
}
