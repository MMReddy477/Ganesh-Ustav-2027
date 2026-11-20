const FESTIVAL_TIME_ZONE = "Asia/Kolkata";

function parseFestivalDate(value: string) {
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00+05:30`
    : value;
  return new Date(dateValue);
}

export function formatFestivalDate(value: string) {
  const date = parseFestivalDate(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: FESTIVAL_TIME_ZONE,
  }).format(date);
}

export function formatFestivalTime(value: string | null | undefined) {
  if (!value) return "Time not recorded";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatFestivalDateTime(value: string) {
  const date = parseFestivalDate(value);
  if (!Number.isFinite(date.getTime())) return value;
  const hasTime = !/^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(hasTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: FESTIVAL_TIME_ZONE,
  }).format(date);
}

export function toFestivalDateTimeLocal(value: string) {
  const date = parseFestivalDate(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: FESTIVAL_TIME_ZONE,
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function toFestivalTimestamp(value: string) {
  return `${value}${value.length === 16 ? ":00" : ""}+05:30`;
}
