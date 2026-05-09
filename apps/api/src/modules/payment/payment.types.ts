export type PaymentMethod = 'upi' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentGateway = 'razorpay' | 'phonepe' | 'paytm' | 'gpay' | 'upi_direct' | 'cash_on_delivery';

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  gateway: PaymentGateway;
  currency: string;
  description?: string;
  metadata?: {
    upiId?: string;
    cardNumber?: string;
    cardHolder?: string;
    bankAccount?: string;
    ifsc?: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  transactionId?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  processedAt?: string;
  failureReason?: string;
  retryAfter?: number; // seconds to wait before retry
  redirectUrl?: string; // for external payment gateways
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  gateway: PaymentGateway;
  status: PaymentStatus;
  transactionId?: string;
  gatewayTransactionId?: string;
  processedAt: string;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
  retryCount: number;
  metadata?: any;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // partial refund
  reason: string;
  processedBy?: string; // admin user who processed refund
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  originalPaymentId: string;
  refundedAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  processedAt: string;
  failureReason?: string;
}

export interface PaymentVerification {
  paymentId: string;
  otp?: string;
  signature?: string;
  upiVpa?: string;
}

export interface PaymentWebhook {
  paymentId: string;
  status: PaymentStatus;
  transactionId?: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  signature?: string;
  timestamp: string;
  metadata?: any;
}

// Payment Gateway Configuration
export interface PaymentGatewayConfig {
  gateway: PaymentGateway;
  enabled: boolean;
  config: {
    merchantId?: string;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    successUrl?: string;
    failureUrl?: string;
    testMode?: boolean;
    upiVpa?: string;
  };
}

// Payment Lifecycle Events
export interface PaymentEvent {
  type: 'payment_initiated' | 'payment_processing' | 'payment_completed' | 'payment_failed' | 'payment_cancelled' | 'refund_initiated' | 'refund_completed' | 'refund_failed';
  paymentId: string;
  bookingId: string;
  status: PaymentStatus;
  amount: number;
  gateway: PaymentGateway;
  timestamp: string;
  metadata?: any;
}

// Payment Processing Rules
export const PAYMENT_RULES = {
  MIN_AMOUNT: 100, // ₹100 minimum
  MAX_AMOUNT: 100000, // ₹1,00,000 maximum
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 300, // 5 minutes
  REFUND_TIME_LIMIT: 7 * 24 * 60 * 60, // 7 days in seconds
  PAYMENT_TIMEOUT: 10 * 60, // 10 minutes
  TRANSACTION_FEE_PERCENTAGE: 0.02, // 2%
  MIN_REFUND_AMOUNT: 1, // ₹1 minimum
} as const;
