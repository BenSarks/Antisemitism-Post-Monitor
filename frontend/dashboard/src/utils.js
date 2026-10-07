const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function shortDate(ddmmyyyy) {
  const [d, m] = ddmmyyyy.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

export const formatNumber = (n) => new Intl.NumberFormat("en-US").format(n);

export const compactNumber = (n) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function timeAgo(timestamp) {
  const seconds = Math.max(0, (Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

export function periodChange(series, window = 7) {
  if (!series || series.length < window * 2) return null;
  const current = sum(series.slice(-window));
  const previous = sum(series.slice(-window * 2, -window));
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function avatarColor(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h}, 55%, 45%)`;
}
