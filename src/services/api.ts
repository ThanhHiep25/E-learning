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

// 🛡️ P1-2 FIX: Global unauthorized handler for 401 responses
let globalUnauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  globalUnauthorizedHandler = handler;
}

export function clearUnauthorizedHandler() {
  globalUnauthorizedHandler = null;
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

export function getApiBaseUrl(): string {
  return (import.meta as any).env?.VITE_API_BASE_URL || DEFAULT_BASE_URL;
}

// 🛡️ P2-7 FIX: Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Base delay, will use exponential backoff

// Helper to delay between retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if error is retryable (network errors, 5xx, timeouts)
const isRetryableError = (error: any, status?: number): boolean => {
  // 5xx server errors
  if (status && status >= 500 && status < 600) return true;
  // Network errors (no status)
  if (!status && error instanceof TypeError) return true;
  // Abort errors are not retryable
  if (error?.name === 'AbortError') return false;
  return false;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean; onUnauthorized?: () => void; retries?: number } = {},
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

  // 🛡️ P2-7 FIX: Implement retry logic with exponential backoff
  const maxRetries = options.retries ?? MAX_RETRIES;
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const text = await res.text();
      const json = text ? (JSON.parse(text) as unknown) : undefined;

      // 🛡️ P1-2 FIX: Handle 401 Unauthorized - Don't retry 401s
      if (res.status === 401) {
        // Clear token since it's invalid
        tokenStorage.clear();
        localStorage.removeItem('elearning_user');
        
        // Call specific handler if provided
        if (options.onUnauthorized) {
          options.onUnauthorized();
        }
        
        // Call global handler if set
        if (globalUnauthorizedHandler) {
          globalUnauthorizedHandler();
        }
        
        throw new ApiError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401, json);
      }

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
      
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on 401 (handled above) or 4xx client errors
      if (error instanceof ApiError) {
        if (error.status === 401 || (error.status >= 400 && error.status < 500)) {
          throw error; // Don't retry client errors
        }
      }
      
      // 🛡️ P2-7 FIX: Check if error is retryable and we haven't exhausted retries
      const isLastAttempt = attempt === maxRetries;
      if (!isLastAttempt && isRetryableError(error, error?.status)) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffDelay = RETRY_DELAY_MS * Math.pow(2, attempt);
        await delay(backoffDelay);
        continue; // Retry
      }
      
      // Not retryable or last attempt - throw the error
      throw error;
    }
  }
  
  // Should never reach here, but just in case
  throw lastError || new ApiError("Request failed after retries", 0);
}
