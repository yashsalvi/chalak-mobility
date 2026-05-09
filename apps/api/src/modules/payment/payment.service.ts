import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentRecord,
  RefundRequest,
  RefundResponse,
  PaymentVerification,
  PaymentWebhook,
  PaymentGatewayConfig,
  PaymentEvent,
  PAYMENT_RULES,
  PaymentMethod,
  PaymentStatus,
  PaymentGateway,
} from './payment.types';

// In-memory storage (in production, use proper database)
const paymentsFile = path.join(__dirname, 'payments.db.json');
const webhooksFile = path.join(__dirname, 'webhooks.db.json');

// Payment gateway configurations
const gatewayConfigs: Record<PaymentGateway, PaymentGatewayConfig> = {
  upi_direct: {
    gateway: 'upi_direct',
    enabled: true,
    config: {
      testMode: true,
      merchantId: 'chalak_merchant_001',
      successUrl: 'https://chalak.com/payment/success',
      failureUrl: 'https://chalak.com/payment/failure',
    }
  },
  phonepe: {
    gateway: 'phonepe',
    enabled: false, // Disabled for demo
    config: {
      testMode: true,
      merchantId: 'phonepe_test_merchant_001',
      apiKey: 'phonepe_test_key_123456',
      secretKey: 'phonepe_test_secret_123456',
      webhookUrl: 'https://api.chalak.com/webhooks/phonepe',
    }
  },
  paytm: {
    gateway: 'paytm',
    enabled: false, // Disabled for demo
    config: {
      testMode: true,
      merchantId: 'paytm_test_merchant_001',
      apiKey: 'paytm_test_key_123456',
      secretKey: 'paytm_test_secret_123456',
      webhookUrl: 'https://api.chalak.com/webhooks/paytm',
    }
  },
  gpay: {
    gateway: 'gpay',
    enabled: false, // Disabled for demo
    config: {
      testMode: true,
      merchantId: 'gpay_test_merchant_001',
      apiKey: 'gpay_test_key_123456',
      secretKey: 'gpay_test_secret_123456',
      webhookUrl: 'https://api.chalak.com/webhooks/gpay',
    }
  },
  razorpay: {
    gateway: 'razorpay',
    enabled: false, // Disabled for demo
    config: {
      testMode: true,
      merchantId: 'rzp_test_123456',
      apiKey: 'rzp_test_key_123456',
      secretKey: 'rzp_test_secret_123456',
      webhookUrl: 'https://api.chalak.com/webhooks/razorpay',
    }
  },
  cash_on_delivery: {
    gateway: 'cash_on_delivery',
    enabled: true,
    config: {}
  }
};

export class PaymentService {
  private payments: PaymentRecord[] = [];
  private webhooks: PaymentWebhook[] = [];

  constructor() {
    this.loadPayments();
    this.loadWebhooks();
  }

  // Process Payment
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    // Validate payment request
    const validation = this.validatePaymentRequest(paymentData);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Get gateway configuration
    const gatewayConfig = gatewayConfigs[paymentData.gateway];
    if (!gatewayConfig?.enabled) {
      throw new Error(`Payment gateway ${paymentData.gateway} is not enabled`);
    }

    // Create payment record
    const payment: PaymentRecord = {
      id: randomUUID(),
      bookingId: paymentData.bookingId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      method: paymentData.method,
      gateway: paymentData.gateway,
      status: 'processing',
      transactionId: this.generateTransactionId(paymentData.gateway),
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 0,
      metadata: paymentData.metadata,
    };

    this.payments.push(payment);
    this.savePayments();

    try {
      // Process payment based on gateway
      const result = await this.processGatewayPayment(paymentData, gatewayConfig);
      
      // Update payment record
      payment.status = result.status;
      payment.transactionId = result.transactionId;
      payment.gatewayTransactionId = result.gatewayTransactionId;
      payment.processedAt = result.processedAt;
      payment.updatedAt = new Date().toISOString();
      
      if (result.status === 'failed') {
        payment.failureReason = result.failureReason;
        payment.retryCount = 1;
      }

      this.savePayments();
      this.createPaymentEvent(payment, 'payment_initiated');

      return {
        success: result.status === 'completed',
        paymentId: payment.id,
        transactionId: result.transactionId,
        status: result.status,
        amount: paymentData.amount,
        currency: paymentData.currency,
        gateway: paymentData.gateway,
        processedAt: result.processedAt,
        failureReason: result.failureReason,
        redirectUrl: result.redirectUrl,
      };

    } catch (error) {
      // Handle payment failure
      payment.status = 'failed';
      payment.failureReason = error instanceof Error ? error.message : 'Unknown error';
      payment.updatedAt = new Date().toISOString();
      this.savePayments();
      this.createPaymentEvent(payment, 'payment_failed');

      throw error;
    }
  }

  // Process Refund
  async processRefund(refundData: RefundRequest): Promise<RefundResponse> {
    const payment = this.payments.find(p => p.id === refundData.paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Only completed payments can be refunded');
    }

    if (!refundData.amount || refundData.amount <= 0) {
      throw new Error('Refund amount must be greater than 0');
    }

    if (refundData.amount > payment.amount) {
      throw new Error('Refund amount cannot exceed original payment amount');
    }

    try {
      // Process refund through gateway
      const gatewayConfig = gatewayConfigs[payment.gateway];
      const result = await this.processGatewayRefund(refundData, payment, gatewayConfig);

      // Create refund record
      const refundId = randomUUID();
      const refundedAmount = refundData.amount || payment.amount;

      // Update original payment record
      payment.status = 'refunded';
      payment.updatedAt = new Date().toISOString();
      this.savePayments();

      this.createPaymentEvent(payment, 'refund_completed');

      return {
        success: true,
        refundId,
        originalPaymentId: payment.id,
        refundedAmount,
        remainingAmount: payment.amount - refundedAmount,
        status: 'refunded',
        processedAt: new Date().toISOString(),
      };

    } catch (error) {
      this.createPaymentEvent(payment, 'refund_failed');
      throw error;
    }
  }

  // Verify Payment
  async verifyPayment(verificationData: PaymentVerification): Promise<boolean> {
    const payment = this.payments.find(p => p.id === verificationData.paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    try {
      // Verify payment with gateway
      const gatewayConfig = gatewayConfigs[payment.gateway];
      const isValid = await this.verifyGatewayPayment(verificationData, payment, gatewayConfig);

      if (isValid) {
        payment.status = 'completed';
        payment.processedAt = new Date().toISOString();
        payment.updatedAt = new Date().toISOString();
        this.savePayments();
        this.createPaymentEvent(payment, 'payment_completed');
      }

      return isValid;

    } catch (error) {
      payment.status = 'failed';
      payment.failureReason = 'Verification failed';
      payment.updatedAt = new Date().toISOString();
      this.savePayments();
      this.createPaymentEvent(payment, 'payment_failed');
      throw error;
    }
  }

  // Handle Webhook
  async handleWebhook(webhookData: PaymentWebhook): Promise<void> {
    try {
      // Verify webhook signature
      const gatewayConfig = gatewayConfigs[webhookData.gateway];
      if (!this.verifyWebhookSignature(webhookData, gatewayConfig)) {
        throw new Error('Invalid webhook signature');
      }

      // Find payment record
      const payment = this.payments.find(p => p.id === webhookData.paymentId);
      if (!payment) {
        throw new Error('Payment not found for webhook');
      }

      // Update payment status
      const oldStatus = payment.status;
      payment.status = webhookData.status;
      payment.transactionId = webhookData.transactionId;
      payment.processedAt = webhookData.timestamp;
      payment.updatedAt = new Date().toISOString();

      if (webhookData.status === 'failed') {
        payment.failureReason = webhookData.metadata?.failureReason;
        payment.retryCount = (payment.retryCount || 0) + 1;
      }

      this.savePayments();
      this.webhooks.push({ ...webhookData, timestamp: webhookData.timestamp || new Date().toISOString() });
      this.saveWebhooks();

      // Create payment status change event
      const eventType = this.getWebhookEventType(webhookData.status, oldStatus);
      this.createPaymentEvent(payment, eventType);

    } catch (error) {
      console.error('[PaymentService] Webhook processing failed:', error);
      throw error;
    }
  }

  // Get Payment by ID
  getPayment(paymentId: string): PaymentRecord | null {
    return this.payments.find(p => p.id === paymentId) || null;
  }

  // Get Payments by Booking ID
  getPaymentsByBooking(bookingId: string): PaymentRecord[] {
    return this.payments.filter(p => p.bookingId === bookingId);
  }

  // Get Payment Status
  getPaymentStatus(paymentId: string): PaymentStatus | null {
    const payment = this.getPayment(paymentId);
    return payment ? payment.status : null;
  }

  // Get Gateway Configuration
  getGatewayConfig(gateway: PaymentGateway): PaymentGatewayConfig | null {
    return gatewayConfigs[gateway] || null;
  }

  // Get All Gateway Configurations
  getAllGatewayConfigs(): Record<PaymentGateway, PaymentGatewayConfig> {
    return gatewayConfigs;
  }

  // Retry Failed Payment
  async retryPayment(paymentId: string): Promise<PaymentResponse> {
    const payment = this.getPayment(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'failed') {
      throw new Error('Only failed payments can be retried');
    }

    if (payment.retryCount >= PAYMENT_RULES.RETRY_ATTEMPTS) {
      throw new Error('Maximum retry attempts exceeded');
    }

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, PAYMENT_RULES.RETRY_DELAY * 1000));

    // Create new payment attempt
    const retryPayment: PaymentRequest = {
      bookingId: payment.bookingId,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      gateway: payment.gateway,
      metadata: {
        ...payment.metadata,
        retryAttempt: payment.retryCount + 1,
        originalPaymentId: payment.id,
      },
    };

    return this.processPayment(retryPayment);
  }

  // Private Methods
  private validatePaymentRequest(paymentData: PaymentRequest): { isValid: boolean; error?: string } {
    if (!paymentData.bookingId) {
      return { isValid: false, error: 'Booking ID is required' };
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      return { isValid: false, error: 'Amount must be greater than 0' };
    }

    if (paymentData.amount < PAYMENT_RULES.MIN_AMOUNT) {
      return { isValid: false, error: `Minimum amount is ₹${PAYMENT_RULES.MIN_AMOUNT}` };
    }

    if (paymentData.amount > PAYMENT_RULES.MAX_AMOUNT) {
      return { isValid: false, error: `Maximum amount is ₹${PAYMENT_RULES.MAX_AMOUNT}` };
    }

    if (!paymentData.currency) {
      return { isValid: false, error: 'Currency is required' };
    }

    return { isValid: true };
  }

  private async processGatewayPayment(paymentData: PaymentRequest, config: PaymentGatewayConfig): Promise<any> {
    // Simulate different payment gateways
    switch (paymentData.gateway) {
      case 'upi_direct':
        return this.processUPIPayment(paymentData, config);
      case 'razorpay':
        return this.processRazorpayPayment(paymentData, config);
      case 'cash_on_delivery':
        return this.processCashPayment(paymentData, config);
      default:
        throw new Error(`Payment gateway ${paymentData.gateway} not implemented`);
    }
  }

  private async processUPIPayment(paymentData: PaymentRequest, config: PaymentGatewayConfig): Promise<any> {
    if (config.config.testMode) {
      // Simulate UPI payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const success = Math.random() > 0.1; // 90% success rate
      return {
        status: success ? 'completed' : 'failed',
        transactionId: `UPI_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        gatewayTransactionId: paymentData.metadata?.upiId || 'test_vpa@upi',
        processedAt: new Date().toISOString(),
        failureReason: success ? undefined : 'Insufficient funds',
        redirectUrl: success ? config.config.successUrl : config.config.failureUrl,
      };
    }

    // Real UPI integration would go here
    throw new Error('Real UPI integration not implemented');
  }

  private async processRazorpayPayment(paymentData: PaymentRequest, config: PaymentGatewayConfig): Promise<any> {
    // Razorpay integration (simulated for demo)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const success = Math.random() > 0.2; // 80% success rate
    return {
      status: success ? 'completed' : 'failed',
      transactionId: `RZP_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      gatewayTransactionId: `order_${Date.now()}`,
      processedAt: new Date().toISOString(),
      failureReason: success ? undefined : 'Payment declined',
      redirectUrl: success ? config.config.successUrl : config.config.failureUrl,
    };
  }

  private async processCashPayment(paymentData: PaymentRequest, config: PaymentGatewayConfig): Promise<any> {
    // Cash payment - mark as pending verification
    return {
      status: 'pending',
      transactionId: `CASH_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      processedAt: new Date().toISOString(),
      failureReason: undefined,
      redirectUrl: undefined,
    };
  }

  private async processGatewayRefund(refundData: RefundRequest, payment: PaymentRecord, config: PaymentGatewayConfig): Promise<any> {
    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      refundId: `REF_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      processedAt: new Date().toISOString(),
    };
  }

  private async verifyGatewayPayment(verificationData: PaymentVerification, payment: PaymentRecord, config: PaymentGatewayConfig): Promise<boolean> {
    // Simulate payment verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Math.random() > 0.1; // 90% success rate
  }

  private verifyWebhookSignature(webhookData: PaymentWebhook, config: PaymentGatewayConfig): boolean {
    // In production, implement proper signature verification
    return config.config.testMode || true; // Always accept in test mode
  }

  private generateTransactionId(gateway: PaymentGateway): string {
    return `${gateway.toUpperCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  private getWebhookEventType(status: PaymentStatus, oldStatus: PaymentStatus): string {
    if (status === 'completed' && oldStatus !== 'completed') return 'payment_completed';
    if (status === 'failed' && oldStatus !== 'failed') return 'payment_failed';
    if (status === 'refunded') return 'refund_completed';
    return 'payment_processing';
  }

  private createPaymentEvent(payment: PaymentRecord, eventType: string): void {
    const event: PaymentEvent = {
      type: eventType as any,
      paymentId: payment.id,
      bookingId: payment.bookingId,
      status: payment.status,
      amount: payment.amount,
      gateway: payment.gateway,
      timestamp: new Date().toISOString(),
      metadata: {
        transactionId: payment.transactionId,
        gatewayTransactionId: payment.gatewayTransactionId,
        retryCount: payment.retryCount,
        failureReason: payment.failureReason,
      },
    };

    // In production, store events in database
    console.log(`[PaymentService] Event: ${eventType}`, event);
  }

  private loadPayments(): void {
    try {
      if (existsSync(paymentsFile)) {
        const data = readFileSync(paymentsFile, 'utf8');
        this.payments = JSON.parse(data);
      }
    } catch (error) {
      console.error('[PaymentService] Failed to load payments:', error);
    }
  }

  private savePayments(): void {
    try {
      writeFileSync(paymentsFile, JSON.stringify(this.payments, null, 2), 'utf8');
    } catch (error) {
      console.error('[PaymentService] Failed to save payments:', error);
    }
  }

  private loadWebhooks(): void {
    try {
      if (existsSync(webhooksFile)) {
        const data = readFileSync(webhooksFile, 'utf8');
        this.webhooks = JSON.parse(data);
      }
    } catch (error) {
      console.error('[PaymentService] Failed to load webhooks:', error);
    }
  }

  private saveWebhooks(): void {
    try {
      writeFileSync(webhooksFile, JSON.stringify(this.webhooks, null, 2), 'utf8');
    } catch (error) {
      console.error('[PaymentService] Failed to save webhooks:', error);
    }
  }
}

export const paymentService = new PaymentService();
