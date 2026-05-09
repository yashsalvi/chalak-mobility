/**
 * Booking Form Models and Interfaces
 * Defines all data structures for the booking flow
 * Production-ready with comprehensive type safety
 */ 

// Vehicle Selection Step
export interface Vehicle {
  id: string;
  name: string;
  type: 'scooter' | 'tempo' | 'delivery';
  pricePerDay: number;
  available: boolean;
  specifications: {
    range: number; // in km
    topSpeed: number; // in km/h
    loadCapacity: number; // in kg
    chargingTime: number; // in hours
  };
  features: string[];
  imageUrl?: string;
  description: string;
}

export interface VehicleSelection {
  vehicleId: string | null;
  selectedVehicle?: Vehicle;
  startDate: Date | null;
  endDate: Date | null;
  rentalDays: number;
  estimatedCost: number;
}

// Plan Selection Step
export type InsurancePlan = 'basic' | 'standard' | 'premium';
export type RideType = 'standard' | 'premium';

export interface PlanDetails {
  insuranceType: InsurancePlan | null;
  rideType: RideType | null;
  addons: string[];
}

// Booking Details Step
export interface BookingContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountryCode: string; // e.g., '+1', '+44'
  dateOfBirth: Date | null;
  licenseNumber: string;
  licenseCountry: string;
  licenseExpiryDate: Date | null;
}

export interface BookingPickupLocation {
  locationType: 'hub' | 'custom';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface BookingDetails {
  contactInfo: BookingContactInfo;
  pickupLocation: BookingPickupLocation;
  dropoffLocation: BookingPickupLocation;
  specialRequests?: string;
  agreeToTerms?: boolean;
}

export interface KycDetails {
  aadhaarNumber: string;
  aadhaarVerificationStatus: 'pending' | 'verified' | 'failed';
  drivingLicenseUploadStatus: 'pending' | 'uploaded' | 'verified' | 'rejected';
  drivingLicenseDocumentId?: string;
  agreeToTerms: boolean;
  agreeToPenaltyPolicy: boolean;
  agreementVersion: string;
  acceptedAt?: string;
}

// Payment Step
export type PaymentMethod = 'upi' | 'bank-transfer' | 'cash';

export interface PaymentInfo {
  method: PaymentMethod | null;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string; // MM/YY format
  cvv?: string;
  billingAddress?: string;
  saveCard: boolean;
  agreeToAutomaticPayment: boolean;
}

export interface BookingCost {
  rentalCost: number;
  insuranceCost: number;
  addOnsCost: number;
  taxAmount: number;
  discountAmount: number;
  totalCost: number;
}

// Complete Booking Form
export interface BookingForm {
  vehicleSelection: VehicleSelection;
  planDetails: PlanDetails;
  bookingDetails: BookingDetails;
  kycDetails: KycDetails;
  paymentInfo: PaymentInfo;
  costBreakdown: BookingCost;
  bookingReference?: string;
  createdAt?: Date;
  submittedAt?: Date;
}

// Step Validation Status
export interface StepValidationStatus {
  step: number;
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  touched: boolean;
}

// Booking Response
export interface BookingResponse {
  success: boolean;
  bookingId: string;
  bookingReference: string;
  status: string;
  depositRequired: number;
  nextAction: string;
  createdAt: string;
}

// Navigation State
export interface NavigationState {
  currentStep: number;
  completedSteps: number[];
  visitedSteps: number[];
  canProceed: boolean;
  canGoBack: boolean;
  hasUnsavedChanges: boolean;
}

// Validation Rules for each field
export const VALIDATION_RULES = {
  phone: /^[\d\s\-\+\(\)]{10,20}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  licenseNumber: /^[A-Z0-9]{5,20}$/i,
  zipCode: /^[A-Z0-9]{3,10}$/i,
  cardNumber: /^[\d\s]{13,19}$/,
  cvv: /^\d{3,4}$/,
  firstName: /^[a-zA-Z\s'-]{2,50}$/,
  lastName: /^[a-zA-Z\s'-]{2,50}$/,
};

// Constants
export const BOOKING_CONFIG = {
  MAX_RENTAL_DAYS: 365,
  MIN_RENTAL_DAYS: 1,
  MIN_AGE: 18,
  LICENSE_MIN_VALIDITY_DAYS: 6 * 30, // 6 months
  MIN_PICKUP_ADVANCE_HOURS: 2,
  MAX_SPECIAL_REQUESTS_LENGTH: 500,
  TAX_RATE: 0.1, // 10%
  STEP_COUNT: 5,
  COMPLETION_STEP: 6,
};

export const INSURANCE_PLANS: Record<InsurancePlan, { cost: number; coverage: string }> = {
  basic: { cost: 0, coverage: 'Basic maintenance support included' },
  standard: { cost: 25, coverage: 'Standard protection for routine wear and service support' },
  premium: { cost: 45, coverage: 'Priority support with enhanced damage assistance' },
};

/** Optional add-on line items (ids match booking-plan toggle ids) */
export const ADDON_COSTS: Record<string, number> = {};

export const RIDE_TYPES = [
  { type: 'standard' as const, label: 'Self Use', description: 'For individual daily mobility' },
  { type: 'premium' as const, label: 'Delivery Use', description: 'For delivery and gig work' },
];
