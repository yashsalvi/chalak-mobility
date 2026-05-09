import { z } from 'zod';

const bookingStatusValues = [
  'draft',
  'submitted',
  'kyc_pending',
  'deposit_pending',
  'confirmed',
  'active',
  'completed',
  'fined',
  'closed',
  'cancelled',
] as const;

export const bookingIdParamsSchema = z.object({
  id: z.union([
    z.string().uuid('Booking id must be a valid UUID'),
    z.string().regex(/^CHL-\d{8}-[A-Z0-9]{6}$/, 'Booking id or reference must be a valid booking identifier'),
  ]),
});

export const createBookingSchema = z.object({
  idempotencyKey: z.string().min(8),
  vehicleSelection: z.object({
    vehicleType: z.enum(['scooter', 'tempo', 'delivery']),
    vehicleId: z.string().min(1),
    startDate: z.string().date(),
    endDate: z.string().date(),
    rentalDays: z.number().int().positive().max(365),
  }),
  planDetails: z.object({
    insuranceType: z.enum(['basic', 'standard', 'premium']),
    rideType: z.enum(['standard', 'premium']),
    addons: z.array(z.string()).default([]),
  }),
  bookingDetails: z.object({
    contactInfo: z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10).max(20),
      phoneCountryCode: z.string().min(1),
      dateOfBirth: z.string().date(),
      licenseNumber: z.string().min(5),
      licenseCountry: z.string().min(2),
      licenseExpiryDate: z.string().date(),
    }),
    pickupLocation: z.object({
      locationType: z.enum(['hub', 'custom']),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
    }),
    dropoffLocation: z.object({
      locationType: z.enum(['hub', 'custom']),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
    }),
    specialRequests: z.string().max(500).optional(),
  }),
  kyc: z.object({
    aadhaarVerificationStatus: z.enum(['pending', 'verified', 'failed']),
    drivingLicenseUploadStatus: z.enum(['pending', 'uploaded', 'verified', 'rejected']),
    drivingLicenseDocumentId: z.string().optional(),
  }),
  paymentInfo: z
    .object({
      method: z.enum(['upi', 'bank-transfer', 'cash']),
      cardNumber: z.string().optional(),
      cardHolder: z.string().optional(),
      expiryDate: z.string().optional(),
      cvv: z.string().optional(),
      saveCard: z.boolean(),
    })
    .optional(),
  agreements: z.object({
    agreeToTerms: z.literal(true),
    agreeToPenaltyPolicy: z.literal(true),
    agreementVersion: z.string().min(1),
    acceptedAt: z.string().datetime(),
  }),
  metadata: z
    .object({
      userAgent: z.string().optional(),
      sessionId: z.string().optional(),
    })
    .optional(),
});

export const bookingCancelSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const bookingStatusUpdateSchema = z.object({
  toStatus: z.enum(bookingStatusValues),
  reason: z.string().min(3).max(500),
});

export type CreateBookingPayload = z.infer<typeof createBookingSchema>;
export type BookingCancelPayload = z.infer<typeof bookingCancelSchema>;
export type BookingStatusUpdatePayload = z.infer<typeof bookingStatusUpdateSchema>;
