import socket from "../services/socket";

export default function StaffOrders({ orderId }) {

  const updateStatus = (status) => {
    socket.emit("orderStatusUpdate", {
      orderId,
      status
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Order Controls</h2>

      <button
        className="bg-yellow-500 text-white px-4 py-2 mr-2 rounded"
        onClick={() => updateStatus("processing")}
      >
        Mark Processing
      </button>

      <button
        className="bg-green-600 text-white px-4 py-2 mr-2 rounded"
        onClick={() => updateStatus("ready")}
      >
        Mark Ready
      </button>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => updateStatus("delivered")}
      >
        Mark Delivered
      </button>
    </div>
  );
}
