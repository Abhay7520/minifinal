// Explicitly separate your two live Render servers
export const NODE_BACKEND_URL = "https://minifinal-a22h.onrender.com"; // For Tracking, Maps, Staff Logistics
export const AI_BACKEND_URL = "https://minifinal-1.onrender.com";    // For Auth (Signup/Login) and AI Core
//  Modify API_BASE dynamically based on the path
export function getApiUrl(path: string): string {
  // If the frontend asks for /auth or AI components, send it to the Python backend
  if (path.startsWith('/auth') || path.startsWith('/address') || path.startsWith('/anomaly') || path.startsWith('/eta') || path.startsWith('/risk')) || path.startsWith('/search-address') || path.startsWith('/validate-address')|| path.startsWith('/staff') || path.startsWith('/incident') || path.startsWith('/voice') {
    return `${AI_BACKEND_URL}${path}`;
  }
  // Otherwise, send it to the core Node logistics backend
  return `${NODE_BACKEND_URL}${path}`;
}

// Keeping API_BASE pointing to your core Node backend to avoid breaking existing tracking routes
const API_BASE = NODE_BACKEND_URL;

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : data?.detail?.message || data?.message || response.statusText;
    throw new ApiError(message, response.status, data?.detail ?? data);
  }

  return data as T;
}

export async function apiGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(getApiUrl(path));
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export { API_BASE };
