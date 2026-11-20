export function getReceiptPublicUrl(receiptNo: string, receiptToken: string, requestOrigin: string) {
  const baseUrl = getReceiptBaseUrl(requestOrigin);
  if (!baseUrl) return null;
  try {
    const url = new URL(getReceiptPath(receiptNo, receiptToken), baseUrl);
    if (url.protocol !== "https:" && process.env.NODE_ENV === "production") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getReceiptPath(receiptNo: string, receiptToken: string) {
  const encodedReceiptNo = receiptNo.split("/").map(encodeURIComponent).join("/");
  return `/receipt/${encodedReceiptNo}?token=${encodeURIComponent(receiptToken)}`;
}

export function getReceiptImagePath(receiptNo: string, receiptToken: string) {
  const query = new URLSearchParams({ receiptNo, token: receiptToken });
  return `/api/receipt/image?${query.toString()}`;
}

export function getReceiptPdfPath(receiptNo: string, receiptToken: string) {
  const query = new URLSearchParams({ receiptNo, token: receiptToken });
  return `/api/receipt/pdf?${query.toString()}`;
}

function getReceiptBaseUrl(requestOrigin: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return configuredUrl || (process.env.NODE_ENV === "production" ? "" : requestOrigin);
}

export function getReceiptImageUrl(receiptNo: string, receiptToken: string, requestOrigin: string) {
  const baseUrl = getReceiptBaseUrl(requestOrigin);
  if (!baseUrl) return null;
  try {
    const url = new URL(getReceiptImagePath(receiptNo, receiptToken), baseUrl);
    if (url.protocol !== "https:" && process.env.NODE_ENV === "production") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getReceiptPdfUrl(receiptNo: string, receiptToken: string, requestOrigin: string) {
  const baseUrl = getReceiptBaseUrl(requestOrigin);
  if (!baseUrl) return null;
  try {
    const url = new URL(getReceiptPdfPath(receiptNo, receiptToken), baseUrl);
    if (url.protocol !== "https:" && process.env.NODE_ENV === "production") return null;
    return url.toString();
  } catch {
    return null;
  }
}
