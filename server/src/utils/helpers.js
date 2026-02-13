export const formatINR = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value || 0);
  
  export const formatDateTime = (value) =>
    value
      ? new Date(value).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short"
        })
      : "";
  
  export const STATUS_OPTIONS = ["pending", "paid", "processing", "ready", "delivered"];