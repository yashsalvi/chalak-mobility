import { Router } from 'express';
import { paymentService } from './payment.service';
import { validateRequest } from '../../server/validation';
import { z } from 'zod';
import type { Request, Response } from 'express';
import {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentVerification,
  PaymentWebhook,
} from './payment.types';

// Validation schemas
const processPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().min(100, 'Amount must be at least 100'),
  method: z.enum(['upi', 'credit_card', 'debit_card', 'bank_transfer', 'cash']),
  gateway: z.enum(['upi_direct', 'razorpay', 'phonepe', 'paytm', 'gpay', 'upi_direct', 'cash_on_delivery']),
  currency: z.string().min(1, 'Currency is required'),
});

const refundRequestSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().optional(),
  reason: z.string().min(1, 'Refund reason is required'),
});

const paymentVerificationSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  otp: z.string().optional(),
  signature: z.string().optional(),
  upiVpa: z.string().optional(),
});

const webhookSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded']),
  transactionId: z.string().optional(),
  gateway: z.enum(['upi_direct', 'razorpay', 'phonepe', 'paytm', 'gpay', 'upi_direct', 'cash_on_delivery']),
  amount: z.number(),
  currency: z.string(),
  signature: z.string().optional(),
  timestamp: z.string(),
});

export const paymentRouter = Router();

// POST /api/payments/process - Process Payment
paymentRouter.post('/process', validateRequest('body', processPaymentSchema), async (req: Request, res: Response) => {
  try {
    const paymentData: PaymentRequest = req.body;
    const result = await paymentService.processPayment(paymentData);
    
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Payment processing failed',
    });
  }
});

// POST /api/payments/:paymentId/refund - Process Refund
paymentRouter.post('/:paymentId/refund', validateRequest('params', z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
})), validateRequest('body', refundRequestSchema), async (req: Request, res: Response) => {
  try {
    const refundData: RefundRequest = {
      ...req.body,
      paymentId: req.params.paymentId,
    };
    
    const result = await paymentService.processRefund(refundData);
    
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Refund processing failed',
    });
  }
});

// POST /api/payments/:paymentId/verify - Verify Payment
paymentRouter.post('/:paymentId/verify', validateRequest('params', z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
})), validateRequest('body', paymentVerificationSchema), async (req: Request, res: Response) => {
  try {
    const verificationData: PaymentVerification = {
      ...req.body,
      paymentId: req.params.paymentId,
    };
    
    const isValid = await paymentService.verifyPayment(verificationData);
    
    res.json({
      success: isValid,
      message: isValid ? 'Payment verified successfully' : 'Payment verification failed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Payment verification failed',
    });
  }
});

// GET /api/payments/:paymentId - Get Payment Details
paymentRouter.get('/:paymentId', validateRequest('params', z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
})), async (req: Request, res: Response) => {
  try {
    const payment = paymentService.getPayment(req.params.paymentId);
    
    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
    });
  }
});

// GET /api/payments/booking/:bookingId - Get Payments by Booking
paymentRouter.get('/booking/:bookingId', validateRequest('params', z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
})), async (req: Request, res: Response) => {
  try {
    const payments = paymentService.getPaymentsByBooking(req.params.bookingId);
    
    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking payments',
    });
  }
});

// POST /api/payments/webhook/:gateway - Handle Payment Webhook
paymentRouter.post('/webhook/:gateway', validateRequest('params', z.object({
  gateway: z.string().min(1, 'Gateway is required'),
})), validateRequest('body', webhookSchema), async (req: Request, res: Response) => {
  try {
    const webhookData: PaymentWebhook = {
      ...req.body,
      gateway: req.params.gateway as any,
    };
    
    await paymentService.handleWebhook(webhookData);
    
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
});

// GET /api/payments/gateways - Get Available Payment Gateways
paymentRouter.get('/gateways', async (req: Request, res: Response) => {
  try {
    const gateways = paymentService.getAllGatewayConfigs();
    
    res.json({
      success: true,
      data: gateways,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment gateways',
    });
  }
});

// POST /api/payments/:paymentId/retry - Retry Failed Payment
paymentRouter.post('/:paymentId/retry', validateRequest('params', z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
})), async (req: Request, res: Response) => {
  try {
    const result = await paymentService.retryPayment(req.params.paymentId);
    
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Payment retry failed',
    });
  }
});
