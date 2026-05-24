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
  totalSpent?: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type CheckoutSession = {
  sessionId: string;
  checkoutUrl: string;
  provider: 'vnpay' | 'stripe';
  expiresAt: string;
};

export type StripeSessionPaymentStatus = {
  id: string;
  courseTitle?: string;
  courses?: Array<{ id: number; title: string; price: number }>;
  amount: number;
  status: string;
  createdAt: string;
};

export const paymentService = {
  async createSingleCheckoutSession(
    courseId: string,
    provider: 'vnpay' | 'stripe'
  ): Promise<CheckoutSession> {
    if (provider === 'stripe') {
      // apiRequest auto-unwraps { success: true, data: {...} } to just {...}
      const data = await apiRequest<{
        checkoutUrl: string;
        sessionId: string;
        payment: BackendPayment;
      }>("student/payments/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({
          courseId: Number(courseId),
          // Stripe must append CHECKOUT_SESSION_ID so success page can verify and finalize payment
          successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/payment?courseId=${courseId}`,
        }),
      });
      
      if (!data?.sessionId || !data?.checkoutUrl) {
        throw new Error('Không thể tạo phiên thanh toán Stripe');
      }
      
      return {
        sessionId: data.sessionId,
        checkoutUrl: data.checkoutUrl,
        provider: 'stripe',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    } else {
      // VNPay - apiRequest auto-unwraps response
      const data = await apiRequest<{
        paymentUrl: string;
        txnRef: string;
        payment: BackendPayment;
      }>(`student/payments/vnpay/${courseId}`, {
        method: "POST",
      });
      
      if (!data?.txnRef || !data?.paymentUrl) {
        throw new Error('Không thể tạo URL thanh toán VNPay');
      }
      
      return {
        sessionId: data.txnRef,
        checkoutUrl: data.paymentUrl,
        provider: 'vnpay',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    }
  },

  async createRenewalCheckoutSession(
    courseId: string,
    enrollmentId: string,
    months: number,
    provider: 'vnpay' | 'stripe',
    renewalPrice?: number
  ): Promise<CheckoutSession> {
    const endpoint = provider === 'stripe'
      ? 'student/payments/stripe/checkout'
      : `student/payments/vnpay/${courseId}`;
    
    const body = provider === 'stripe' ? JSON.stringify({
      courseId: Number(courseId),
      enrollmentId: Number(enrollmentId),
      renewalMonths: months,
      type: 'renewal',
      renewalPrice,
      // Don't send successUrl/cancelUrl - let backend use default with {CHECKOUT_SESSION_ID}
    }) : JSON.stringify({
      enrollmentId: Number(enrollmentId),
      renewalMonths: months,
      type: 'renewal',
      renewalPrice,
    });

    const data = await apiRequest<{
      checkoutUrl?: string;
      paymentUrl?: string;
      sessionId?: string;
      txnRef?: string;
      payment?: BackendPayment;
    }>(endpoint, {
      method: 'POST',
      body,
    });

    if (!data) {
      throw new Error('Không thể tạo phiên thanh toán gia hạn');
    }

    return {
      sessionId: data.sessionId || data.txnRef || '',
      checkoutUrl: data.checkoutUrl || data.paymentUrl || '',
      provider,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  },

  async processPayment(params: {
    courseId: string;
    paymentMethod: "stripe" | "paypal" | "bank_transfer" | "mock";
    paymentDetails?: Record<string, unknown>;
  }): Promise<ProcessPaymentResponse> {
    const data = await apiRequest<ProcessPaymentResponse>("student/payments/create", {
      method: "POST",
      body: JSON.stringify({
        courseId: Number(params.courseId),
        provider: params.paymentMethod,
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
    status?: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  }): Promise<PaymentHistoryResponse> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', String(params.status));

    const path = q.toString() ? `student/payments/history?${q.toString()}` : 'student/payments/history';
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

  async verifyStripeSession(sessionId: string): Promise<unknown> {
    return apiRequest('student/payments/stripe/verify', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },

  async getStripeSessionStatus(sessionId: string): Promise<StripeSessionPaymentStatus> {
    return apiRequest<StripeSessionPaymentStatus>(`student/payments/stripe/status?session_id=${encodeURIComponent(sessionId)}`, {
      method: 'GET',
    });
  },

  async requestRefund(paymentId: string | number, reason: string): Promise<any> {
    const data = await apiRequest(`student/payments/${paymentId}/refund`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    return data;
  },

  async downloadInvoice(paymentId: string | number): Promise<void> {
    const token = localStorage.getItem("elearning_token");
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000";
    const apiUrl = `${baseUrl}/api/student/payments/${paymentId}/invoice`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = "Lỗi khi tải hóa đơn";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Lỗi hệ thống: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_${paymentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
