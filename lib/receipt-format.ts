const smallNumbers = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function underHundred(value: number) {
  if (value < 20) return smallNumbers[value];
  const remainder = value % 10;
  return `${tens[Math.floor(value / 10)]}${remainder ? ` ${smallNumbers[remainder]}` : ""}`;
}

function underThousand(value: number) {
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  return `${hundreds ? `${smallNumbers[hundreds]} hundred` : ""}${hundreds && remainder ? " " : ""}${remainder ? underHundred(remainder) : ""}`;
}

function indianNumberToWords(value: number): string {
  if (value < 1000) return underThousand(value);
  const crore = Math.floor(value / 10000000);
  const lakh = Math.floor((value % 10000000) / 100000);
  const thousand = Math.floor((value % 100000) / 1000);
  const remainder = value % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${indianNumberToWords(crore)} crore`);
  if (lakh) parts.push(`${underHundred(lakh)} lakh`);
  if (thousand) parts.push(`${underHundred(thousand)} thousand`);
  if (remainder) parts.push(underThousand(remainder));
  return parts.join(" ");
}

export function donationAmountInWords(amount: number) {
  const totalPaise = Math.round(amount * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  const rupeeText = `${indianNumberToWords(rupees)} ${rupees === 1 ? "rupee" : "rupees"}`;
  return paise ? `${rupeeText} and ${indianNumberToWords(paise)} ${paise === 1 ? "paise" : "paise"} only` : `${rupeeText} only`;
}

export function formatReceiptAmount(amount: number) {
  return `₹ ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatReceiptDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
