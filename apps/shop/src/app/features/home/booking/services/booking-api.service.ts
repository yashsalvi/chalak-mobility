/**
 * Booking API Service
 * Handles all API communication for booking operations
 * Production-grade with typed contracts, error handling, retry logic, idempotency
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
import { BookingForm, BookingResponse } from '../models/booking.model';

/**
 * Strict API Request/Response contracts
 * These define the exact shape of data sent to/from the backend
 */

// POST /bookings request payload
export interface CreateBookingRequest {
  idempotencyKey: string;
  vehicleSelection: {
    vehicleType: 'scooter' | 'tempo' | 'delivery';
    vehicleId: string;
    startDate: string; // ISO 8601 date
    endDate: string;
    rentalDays: number;
  };
  planDetails: {
    insuranceType: 'basic' | 'standard' | 'premium';
    rideType: 'standard' | 'premium';
    addons: string[];
  };
  bookingDetails: {
    contactInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      phoneCountryCode: string;
      dateOfBirth: string; // ISO 8601
      licenseNumber: string;
      licenseCountry: string;
      licenseExpiryDate: string; // ISO 8601
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
  };
  kyc: {
    aadhaarVerificationStatus: 'pending' | 'verified' | 'failed';
    drivingLicenseUploadStatus: 'pending' | 'uploaded' | 'verified' | 'rejected';
    drivingLicenseDocumentId?: string;
  };
  paymentInfo: {
    method: 'upi' | 'bank-transfer' | 'cash';
    cardNumber?: string;
    cardHolder?: string;
    expiryDate?: string;
    cvv?: string;
    saveCard: boolean;
  };
  agreements: {
    agreeToTerms: boolean;
    agreeToPenaltyPolicy: boolean;
    agreementVersion: string;
    acceptedAt: string;
  };
  metadata?: {
    userAgent?: string;
    sessionId?: string;
  };
}

// GET /bookings/:id response
export interface BookingDetailsResponse {
  bookingId: string;
  bookingReference: string;
  status: BookingStatus;
  userId?: string;
  createdAt: string;
  submittedAt?: string;

  // Rental Details
  vehicleId: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  rentalDays: number;

  // Options
  insuranceType: string;
  rideType: string;
  addons: string[];

  // Contact Info
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };

  // Locations
  pickupLocation: {
    locationType: string;
    address?: string;
    city?: string;
  };
  dropoffLocation: {
    locationType: string;
    address?: string;
    city?: string;
  };

  // **CRITICAL**: Server-computed totals (NOT client-side)
  costBreakdown: {
    rentalCost: number;
    insuranceCost: number;
    addonsCost: number;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalCost: number;
  };

  // **CRITICAL**: Server-computed deposit & penalties
  deposit: number;
  lateReturnFinePerDay: number;
  damageFine: number;
  misusePenalty: number;
  batteryDamagePenalty: number;

  // KYC Status
  kycStatus?: 'pending' | 'uploaded' | 'verified' | 'rejected';
  kycRejectionReason?: string;

  // Agreement Evidence
  agreementAcceptedAt?: string;
  agreementVersion?: string;
  penaltyPolicyAccepted?: boolean;

  // Fraud signals
  fraudFlags?: {
    riskScore: number;
    riskReasons: string[];
  };

  // Next Actions
  nextAction?: string;
  actionRequiredBy?: string;

  // Payment
  paymentStatus?: 'pending' | 'processing' | 'completed' | 'failed';

  // Audit
  events?: Array<{
    type: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
}

export interface BookingSummary {
  bookingId: string;
  bookingReference: string;
  status: BookingStatus;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  createdAt: string;
}

export type BookingStatus =
  | 'draft'
  | 'submitted'
  | 'kyc_pending'
  | 'deposit_pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'fined'
  | 'closed';

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string>;
  requestId?: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookingApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = '/api';
  private readonly bookingsEndpoint = `${this.apiBaseUrl}/bookings`;
  private isLoading$ = new BehaviorSubject<boolean>(false);

  /**
   * Submit booking to backend
   * Server will compute deposit, fines, penalties and return signed response
   */
  submitBooking(bookingForm: BookingForm): Observable<BookingResponse> {
    this.isLoading$.next(true);

    const idempotencyKey = crypto.randomUUID();
    const request = this.mapFormToApiRequest(bookingForm, idempotencyKey);

    return this.http.post<BookingResponse>(this.bookingsEndpoint, request).pipe(
      retry({
        count: 2,
        delay: 1000,
      }),
      map((response) => {
        this.isLoading$.next(false);
        if (!response.bookingReference) {
          throw new Error('Invalid booking response from server');
        }
        return response;
      }),
      catchError((error) => {
        this.isLoading$.next(false);
        return this.handleApiError(error);
      })
    );
  }

  /**
   * Fetch booking details by reference (for success page reload)
   * Called when user revisits success page to get current booking status
   */
  getBooking(bookingId: string): Observable<BookingDetailsResponse> {
    this.isLoading$.next(true);

    return this.http.get<BookingDetailsResponse>(`${this.bookingsEndpoint}/${bookingId}`).pipe(
      map((response) => {
        this.isLoading$.next(false);
        return response;
      }),
      catchError((error) => {
        this.isLoading$.next(false);
        return this.handleApiError(error);
      })
    );
  }

  getBookings(sessionId?: string): Observable<BookingSummary[]> {
    this.isLoading$.next(true);

    const url = sessionId
      ? `${this.bookingsEndpoint}?sessionId=${encodeURIComponent(sessionId)}`
      : this.bookingsEndpoint;

    return this.http.get<{ success: boolean; data: BookingSummary[] }>(url).pipe(
      map((response) => {
        this.isLoading$.next(false);
        if (!response.success) {
          throw new Error('Failed to load bookings');
        }
        return response.data || [];
      }),
      catchError((error) => {
        this.isLoading$.next(false);
        return this.handleApiError(error);
      })
    );
  }

  /**
   * Get booking status (lightweight check)
   */
  getBookingStatus(bookingId: string): Observable<{
    status: BookingStatus;
    nextAction?: string;
  }> {
    return this.http
      .get<{ status: BookingStatus; nextAction?: string }>(
        `${this.bookingsEndpoint}/${bookingId}/status`
      )
      .pipe(catchError((error) => this.handleApiError(error)));
  }

  /**
   * Get loading state
   */
  getIsLoading$(): Observable<boolean> {
    return this.isLoading$.asObservable();
  }

  /**
   * Map frontend BookingForm to API request
   */
  private mapFormToApiRequest(form: BookingForm, idempotencyKey: string): CreateBookingRequest {
    if (
      !form.vehicleSelection ||
      !form.planDetails ||
      !form.bookingDetails ||
      !form.paymentInfo
    ) {
      throw new Error('Incomplete booking form');
    }

    const vehicleSelection = form.vehicleSelection;
    const planDetails = form.planDetails;
    const paymentInfo = form.paymentInfo;

    if (
      !vehicleSelection.vehicleId ||
      !planDetails.insuranceType ||
      !planDetails.rideType ||
      !paymentInfo.method
    ) {
      throw new Error('Incomplete booking selection. Please complete all form steps.');
    }

    return {
      idempotencyKey,
      vehicleSelection: {
        vehicleType: vehicleSelection.selectedVehicle?.type ?? 'scooter',
        vehicleId: vehicleSelection.vehicleId,
        startDate: this.formatDate(vehicleSelection.startDate),
        endDate: this.formatDate(vehicleSelection.endDate),
        rentalDays: vehicleSelection.rentalDays,
      },
      planDetails: {
        insuranceType: planDetails.insuranceType,
        rideType: planDetails.rideType,
        addons: planDetails.addons || [],
      },
      bookingDetails: {
        contactInfo: {
          firstName: form.bookingDetails.contactInfo.firstName,
          lastName: form.bookingDetails.contactInfo.lastName,
          email: form.bookingDetails.contactInfo.email,
          phone: form.bookingDetails.contactInfo.phone,
          phoneCountryCode: form.bookingDetails.contactInfo.phoneCountryCode,
          dateOfBirth: this.formatDate(form.bookingDetails.contactInfo.dateOfBirth),
          licenseNumber: form.bookingDetails.contactInfo.licenseNumber,
          licenseCountry: form.bookingDetails.contactInfo.licenseCountry,
          licenseExpiryDate: this.formatDate(form.bookingDetails.contactInfo.licenseExpiryDate),
        },
        pickupLocation: {
          locationType: form.bookingDetails.pickupLocation.locationType,
          address: form.bookingDetails.pickupLocation.address,
          city: form.bookingDetails.pickupLocation.city,
          state: form.bookingDetails.pickupLocation.state,
          zipCode: form.bookingDetails.pickupLocation.zipCode,
        },
        dropoffLocation: {
          locationType: form.bookingDetails.dropoffLocation.locationType,
          address: form.bookingDetails.dropoffLocation.address,
          city: form.bookingDetails.dropoffLocation.city,
          state: form.bookingDetails.dropoffLocation.state,
          zipCode: form.bookingDetails.dropoffLocation.zipCode,
        },
        specialRequests: form.bookingDetails.specialRequests,
      },
      kyc: {
        aadhaarVerificationStatus: form.kycDetails.aadhaarVerificationStatus,
        drivingLicenseUploadStatus: form.kycDetails.drivingLicenseUploadStatus,
        drivingLicenseDocumentId: form.kycDetails.drivingLicenseDocumentId,
      },
      paymentInfo: {
        method: paymentInfo.method,
        cardNumber: paymentInfo.cardNumber,
        cardHolder: paymentInfo.cardHolder,
        expiryDate: paymentInfo.expiryDate,
        cvv: paymentInfo.cvv,
        saveCard: paymentInfo.saveCard || false,
      },
      agreements: {
        agreeToTerms: form.kycDetails.agreeToTerms,
        agreeToPenaltyPolicy: form.kycDetails.agreeToPenaltyPolicy,
        agreementVersion: form.kycDetails.agreementVersion,
        acceptedAt: form.kycDetails.acceptedAt || new Date().toISOString(),
      },
      metadata: {
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId(),
      },
    };
  }

  private formatDate(date: Date | null): string {
    if (!date) return '';
    if (typeof date === 'string') return date;

    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private getSessionId(): string {
    let sessionId = localStorage.getItem('booking-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('booking-session-id', sessionId);
    }
    return sessionId;
  }

  private handleApiError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing your booking. Please try again.';
    let details: Record<string, string> = {};

    if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.status === 400) {
      errorMessage = error.error?.error || 'Invalid booking data.';
      details = error.error?.details || {};
    } else if (error.status === 401 || error.status === 403) {
      errorMessage = 'Authentication failed. Please log in and try again.';
    } else if (error.status === 409) {
      errorMessage = 'This booking has already been submitted. Please check your bookings.';
    } else if (error.status === 422) {
      errorMessage = error.error?.error || 'This booking cannot be processed at this time.';
      details = error.error?.details || {};
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Our team has been notified. Please try again later.';
    }

    const apiError: ApiErrorResponse = {
      success: false,
      error: errorMessage,
      details,
      requestId: error.error?.requestId,
      timestamp: new Date().toISOString(),
    };

    console.error('[BookingApiService]', {
      status: error.status,
      message: errorMessage,
      requestId: apiError.requestId,
    });

    return throwError(() => apiError);
  }
}

