import { apiRequest } from "./api";

export type BackendPayment = {
  id: string | number;
  userId: string | number;
  courseId: string | number;
  amount: number;
  currency?: string;
  provider: "stripe" | "paypal" | "bank_transfer" | "mock" | string;
  providerTxn?: string;
  status: "pending" | "completed" | "failed" | "cancelled" | string;
  paymentDetails?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type ProcessPaymentResponse = {
  success: boolean;
  message?: string;
  paymentUrl?: string;
  paymentId?: string | number;
  payment?: BackendPayment;
  enrollment?: unknown;
  bankInfo?: unknown;
};

export type VerifyPaymentResponse = {
  payment: BackendPayment;
  enrollment: unknown;
};

export type PaymentHistoryResponse = {
  payments: BackendPayment[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export const paymentService = {
  async processPayment(params: {
    courseId: string;
    paymentMethod: "stripe" | "paypal" | "bank_transfer" | "mock";
    paymentDetails?: Record<string, unknown>;
  }): Promise<ProcessPaymentResponse> {
    const data = await apiRequest<ProcessPaymentResponse>("student/payments/process", {
      method: "POST",
      body: JSON.stringify({
        courseId: Number(params.courseId),
        paymentMethod: params.paymentMethod,
        paymentDetails: params.paymentDetails || {},
      }),
    });

    return data;
  },

  async verifyPayment(params: {
    paymentId: string | number;
    verificationData?: Record<string, unknown>;
  }): Promise<VerifyPaymentResponse> {
    const data = await apiRequest<VerifyPaymentResponse>("student/payments/verify", {
      method: "POST",
      body: JSON.stringify({
        paymentId: Number(params.paymentId),
        verificationData: params.verificationData || {},
      }),
    });

    return data;
  },

  async listPayments(params?: {
    page?: number;
    limit?: number;
    status?: "pending" | "completed" | "failed" | "cancelled";
  }): Promise<PaymentHistoryResponse> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', String(params.status));

    const path = q.toString() ? `student/payments?${q.toString()}` : 'student/payments';
    const data = await apiRequest<PaymentHistoryResponse>(path, {
      method: 'GET',
    });

    return data;
  },

  async getPayment(paymentId: string | number): Promise<BackendPayment> {
    const data = await apiRequest<{ payment: BackendPayment }>(`student/payments/${paymentId}`, {
      method: 'GET',
    });

    return data.payment;
  },
};
