export const NODE_BACKEND_URL = "https://minifinal-a22h.onrender.com"; 
export const AI_BACKEND_URL = "https://minifinal-1.onrender.com";    

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

export function getApiUrl(path: string): string {
  if (
    path.startsWith('/auth') || 
    path.startsWith('/address') || 
    path.startsWith('/search-address') || 
    path.startsWith('/validate-address') || 
    path.startsWith('/anomaly') || 
    path.startsWith('/eta') || 
    path.startsWith('/risk')
  ) {
    return `${AI_BACKEND_URL}${path}`;
  }
  return `${NODE_BACKEND_URL}${path}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  
  if (!text || text.trim().startsWith("<")) {
     throw new ApiError("Server returned HTML, not JSON. Routing mismatch.", response.status);
  }

  const data = JSON.parse(text);

  if (!response.ok) {
    throw new ApiError(data?.message || response.statusText, response.status, data);
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
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  return parseResponse<T>(response);
}