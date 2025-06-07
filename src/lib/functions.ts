export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().split("T")[0]; // Returns date in YYYY-MM-DD format
};

export const formatDateToWords = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const truncateText = (
  text: string,
  maxLength: number = 100,
  suffix: string = "..."
): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);
};
