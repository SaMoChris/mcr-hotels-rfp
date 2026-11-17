import type { Format } from "./model/types";

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const num2 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export const money = (n: number) => usd0.format(n);
export const hours = (n: number) => num1.format(n);
export const whole = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

export function formatValue(n: number, format: Format): string {
  switch (format) {
    case "usd":
      return usd0.format(n);
    case "pct":
      return `${num2.format(n * 100)}%`;
    case "flag":
      return n > 0 ? "Yes" : "No";
    case "hours":
    case "num":
      return num2.format(n);
  }
}

/** The text a person types when editing: percents as 15, not 0.15. */
export function toEditable(n: number, format: Format): string {
  if (format === "pct") return String(+(n * 100).toFixed(4));
  return String(+n.toFixed(4));
}

/** Parses what a person typed. Returns null when it is not a number. */
export function fromEditable(text: string, format: Format): number | null {
  const cleaned = text.replace(/[$,%\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return format === "pct" ? n / 100 : n;
}

export function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function day(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
