export type ApiSuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: unknown[];
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const TOKEN_KEY = "elearning_token";

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

const DEFAULT_BASE_URL = "http://localhost:5000";

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || DEFAULT_BASE_URL;
  const url = joinUrl(joinUrl(baseUrl, "api"), path);

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    const bodyAny = options.body as any;
    const isFormData = typeof FormData !== "undefined" && bodyAny instanceof FormData;
    if (!isFormData) {
      headers.set("Content-Type", "application/json");
    }
  }

  if (options.auth !== false) {
    const token = tokenStorage.get();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    const message =
      (json as any)?.message ||
      (typeof json === "string" ? json : undefined) ||
      res.statusText ||
      "Request failed";
    throw new ApiError(message, res.status, json);
  }

  if (json && typeof json === "object" && (json as any).success === false) {
    throw new ApiError((json as any).message || "Request failed", res.status, json);
  }

  if (json && typeof json === "object" && (json as any).success === true && "data" in (json as any)) {
    return (json as any).data as T;
  }

  return json as T;
}
