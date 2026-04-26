export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long"
  }).format(new Date(dateString));
}

export function formatDateCompact(dateString: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(dateString));
}

export function formatGuestSummary(adults: number, children: number) {
  const parts = [`${adults} yetişkin`];
  if (children > 0) parts.push(`${children} çocuk`);
  return parts.join(" · ");
}

export function nightsBetween(checkin: string, checkout: string) {
  const start = new Date(checkin);
  const end = new Date(checkout);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}
