export type VehicleType = 'scooter' | 'tempo' | 'delivery';
export type InsuranceType = 'basic' | 'standard' | 'premium';
export type RideType = 'standard' | 'premium';
export type BookingStatus =
  | 'draft'
  | 'submitted'
  | 'kyc_pending'
  | 'deposit_pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'fined'
  | 'closed'
  | 'cancelled';

export interface CreateBookingRequest {
  userId: string;
  idempotencyKey: string;
  vehicleSelection: {
    vehicleType: VehicleType;
    vehicleId: string;
    startDate: string;
    endDate: string;
    rentalDays: number;
  };
  planDetails: {
    insuranceType: InsuranceType;
    rideType: RideType;
    addons: string[];
  };
  bookingDetails: {
    contactInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      phoneCountryCode: string;
      dateOfBirth: string;
      licenseNumber: string;
      licenseCountry: string;
      licenseExpiryDate: string;
    };
    pickupLocation: {
      locationType: 'hub' | 'custom';
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    dropoffLocation: {
      locationType: 'hub' | 'custom';
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    specialRequests?: string;
    agreeToTerms?: boolean;
    agreeToPenaltyPolicy?: boolean;
  };
  kyc: {
    aadhaarNumber: string;
    aadhaarVerificationStatus: 'pending' | 'verified' | 'failed';
    drivingLicenseUploadStatus: 'pending' | 'uploaded' | 'verified' | 'rejected';
    drivingLicenseDocumentId?: string;
    agreeToTerms: boolean;
    agreeToPenaltyPolicy: boolean;
    agreementVersion: string;
    acceptedAt?: string;
  };
  paymentInfo?: {
    method: 'upi' | 'bank-transfer' | 'cash';
    cardNumber?: string;
    cardHolder?: string;
    expiryDate?: string;
    cvv?: string;
    saveCard: boolean;
  };
  metadata?: {
    userAgent?: string;
    sessionId?: string;
  };
}

export interface BookingRecord extends CreateBookingRequest {
  bookingId: string;
  bookingReference: string;
  vehicleName: string;
  status: BookingStatus;
  costBreakdown: {
    rentalCost: number;
    insuranceCost: number;
    addOnsCost: number;
    taxAmount: number;
    discountAmount: number;
    totalCost: number;
  };
  depositRequired: number;
  lateReturnFinePerDay: number;
  damageFine: number;
  vehicleMisusePenalty: number;
  batteryDamagePenalty: number;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed';
  fraudFlags: {
    riskScore: number;
    riskReasons: string[];
  };
  agreements: {
    acceptedAt?: string;
    agreementVersion: string;
    agreeToPenaltyPolicy: boolean;
  };
  events: Array<{
    type: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface BookingStatusUpdate {
  toStatus: BookingStatus;
  reason: string;
}

export const POLICY_RULES = {
  depositAmount: 3000,
  lateReturnFinePerDay: 200,
  damageFine: 1000,
  vehicleMisusePenalty: 2000,
  batteryDamagePenalty: 5000,
} as const;
