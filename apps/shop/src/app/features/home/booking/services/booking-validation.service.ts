/**
 * Booking Form Validation Service
 * Handles all validation logic for booking form
 * Production-ready with comprehensive error handling
 */

import { Injectable } from '@angular/core';
import {
  BookingForm,
  BookingDetails,
  KycDetails,
  PaymentInfo,
  VehicleSelection,
  PlanDetails,
  StepValidationStatus,
  VALIDATION_RULES,
  BOOKING_CONFIG,
} from '../models/booking.model';

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

@Injectable({
  providedIn: 'root',
})
export class BookingValidationService {
  /**
   * Validate vehicle selection step
   */
  validateVehicleSelection(
    vehicleSelection: VehicleSelection
  ): StepValidationStatus {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};
    const startDate = this.toValidDate(vehicleSelection.startDate);
    const endDate = this.toValidDate(vehicleSelection.endDate);
    const now = new Date();

    // Validate vehicle selection
    if (!vehicleSelection.vehicleId) {
      errors['vehicleId'] = 'Please select a vehicle';
    }

    // Validate dates
    if (!startDate) {
      errors['startDate'] = 'Start date is required';
    } else if (startDate < now) {
      errors['startDate'] = 'Start date cannot be in the past';
    } else if (
      startDate.getTime() - now.getTime() <
      BOOKING_CONFIG.MIN_PICKUP_ADVANCE_HOURS * 60 * 60 * 1000
    ) {
      errors['startDate'] = `Pick-up must be at least ${BOOKING_CONFIG.MIN_PICKUP_ADVANCE_HOURS} hours in advance`;
    }

    if (!endDate) {
      errors['endDate'] = 'End date is required';
    } else if (startDate && endDate <= startDate) {
      errors['endDate'] = 'End date must be after start date';
    }

    // Validate rental duration
    if (vehicleSelection.rentalDays < BOOKING_CONFIG.MIN_RENTAL_DAYS) {
      errors['rentalDays'] = `Minimum rental period is ${BOOKING_CONFIG.MIN_RENTAL_DAYS} day`;
    } else if (vehicleSelection.rentalDays > BOOKING_CONFIG.MAX_RENTAL_DAYS) {
      errors['rentalDays'] = `Maximum rental period is ${BOOKING_CONFIG.MAX_RENTAL_DAYS} days`;
    }

    // Check vehicle availability
    if (
      vehicleSelection.selectedVehicle &&
      !vehicleSelection.selectedVehicle.available
    ) {
      errors['vehicleId'] = 'Selected vehicle is not available for these dates';
    }

    // Validate estimated cost
    if (vehicleSelection.estimatedCost <= 0) {
      errors['estimatedCost'] = 'Invalid cost calculation';
    }

    return {
      step: 1,
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      touched: true,
    };
  }

  private toValidDate(value: Date | string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  /**
   * Validate plan selection step
   */
  validatePlanDetails(planDetails: PlanDetails): StepValidationStatus {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    if (!planDetails.insuranceType) {
      errors['insuranceType'] = 'Please select an insurance plan';
    }

    if (!planDetails.rideType) {
      errors['rideType'] = 'Please select a ride type';
    }

    // Warn if no insurance selected (edge case)
    if (!planDetails.insuranceType && planDetails.rideType) {
      warnings['insuranceType'] =
        'Proceeding without insurance protection. Consider selecting a plan.';
    }

    return {
      step: 2,
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      touched: true,
    };
  }

  /**
   * Validate booking details step
   */
  validateBookingDetails(
    bookingDetails: BookingDetails
  ): StepValidationStatus {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    // Validate contact info
    this.validateContactInfo(bookingDetails.contactInfo, errors, warnings);

    // Validate pickup location
    if (!bookingDetails.pickupLocation.locationType) {
      errors['pickupLocation'] = 'Please select a pickup location type';
    }

    // Validate dropoff location
    if (!bookingDetails.dropoffLocation.locationType) {
      errors['dropoffLocation'] = 'Please select a dropoff location type';
    }

    return {
      step: 3,
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      touched: true,
    };
  }

  validateKycDetails(kycDetails: KycDetails): StepValidationStatus {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    if (!/^\d{12}$/.test(kycDetails.aadhaarNumber || '')) {
      errors['aadhaarNumber'] = 'Aadhaar number must be 12 digits';
    }

    if (!kycDetails.drivingLicenseDocumentId?.trim()) {
      errors['drivingLicenseDocumentId'] = 'Driving license upload reference is required';
    }

    if (!kycDetails.agreeToTerms) {
      errors['agreeToTerms'] = 'You must agree to terms and conditions';
    }

    if (!kycDetails.agreeToPenaltyPolicy) {
      errors['agreeToPenaltyPolicy'] = 'You must accept the penalty policy';
    }

    return {
      step: 4,
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      touched: true,
    };
  }

  /**
   * Validate contact information
   */
  private validateContactInfo(
    contactInfo: BookingDetails['contactInfo'],
    errors: Record<string, string>,
    warnings: Record<string, string>
  ): void {
    // First name
    if (!contactInfo.firstName?.trim()) {
      errors['firstName'] = 'First name is required';
    } else if (!VALIDATION_RULES.firstName.test(contactInfo.firstName)) {
      errors['firstName'] =
        'First name must be 2-50 characters, letters and apostrophes only';
    }

    // Last name
    if (!contactInfo.lastName?.trim()) {
      errors['lastName'] = 'Last name is required';
    } else if (!VALIDATION_RULES.lastName.test(contactInfo.lastName)) {
      errors['lastName'] =
        'Last name must be 2-50 characters, letters and apostrophes only';
    }

    // Email
    if (!contactInfo.email?.trim()) {
      errors['email'] = 'Email is required';
    } else if (!VALIDATION_RULES.email.test(contactInfo.email)) {
      errors['email'] = 'Please enter a valid email address';
    }

    // Phone
    if (!contactInfo.phone?.trim()) {
      errors['phone'] = 'Phone number is required';
    } else if (!VALIDATION_RULES.phone.test(contactInfo.phone)) {
      errors['phone'] =
        'Please enter a valid phone number (10-20 digits with spaces)';
    }

    // Date of birth
    if (!contactInfo.dateOfBirth) {
      errors['dateOfBirth'] = 'Date of birth is required';
    } else {
      const age = this.calculateAge(contactInfo.dateOfBirth);
      if (age < BOOKING_CONFIG.MIN_AGE) {
        errors['dateOfBirth'] = `You must be at least ${BOOKING_CONFIG.MIN_AGE} years old to rent`;
      }
    }

    // License number
    if (!contactInfo.licenseNumber?.trim()) {
      errors['licenseNumber'] = 'Driver license number is required';
    } else if (
      !VALIDATION_RULES.licenseNumber.test(contactInfo.licenseNumber)
    ) {
      errors['licenseNumber'] =
        'Please enter a valid license number (5-20 alphanumeric characters)';
    }

    // License expiry date
    if (!contactInfo.licenseExpiryDate) {
      errors['licenseExpiryDate'] = 'License expiry date is required';
    } else if (contactInfo.licenseExpiryDate < new Date()) {
      errors['licenseExpiryDate'] = 'Driver license has expired';
    } else {
      const daysUntilExpiry = this.daysBetween(
        new Date(),
        contactInfo.licenseExpiryDate
      );
      if (daysUntilExpiry < BOOKING_CONFIG.LICENSE_MIN_VALIDITY_DAYS) {
        warnings['licenseExpiryDate'] =
          'Your license will expire soon. Consider renewing before the rental.';
      }
    }
  }

  /**
   * Validate payment information
   */
  validatePaymentInfo(paymentInfo: PaymentInfo): StepValidationStatus {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    if (!paymentInfo.method) {
      errors['method'] = 'Please select a payment method';
      return { step: 5, isValid: false, errors, warnings, touched: true };
    }

    if (!paymentInfo.agreeToAutomaticPayment) {
      errors['agreeToAutomaticPayment'] =
        'Please accept Chalak payment and deposit policy';
    }

    return {
      step: 5,
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      touched: true,
    };
  }

  /**
   * Validate card information
   */
  private validateCardInfo(
    paymentInfo: PaymentInfo,
    errors: Record<string, string>
  ): void {
    if (!paymentInfo.cardNumber?.trim()) {
      errors['cardNumber'] = 'Card number is required';
    } else {
      // Remove spaces
      const sanitized = paymentInfo.cardNumber.replace(/\s/g, '');
      if (!VALIDATION_RULES.cardNumber.test(paymentInfo.cardNumber)) {
        errors['cardNumber'] = 'Please enter a valid card number (13-19 digits)';
      } else if (!this.luhnCheck(sanitized)) {
        errors['cardNumber'] = 'Invalid card number (failed validation check)';
      }
    }

    if (!paymentInfo.cardHolder?.trim()) {
      errors['cardHolder'] = 'Cardholder name is required';
    }

    if (!paymentInfo.expiryDate?.trim()) {
      errors['expiryDate'] = 'Expiry date is required';
    } else {
      const expiryError = this.validateExpiryDate(paymentInfo.expiryDate);
      if (expiryError) {
        errors['expiryDate'] = expiryError;
      }
    }

    if (!paymentInfo.cvv?.trim()) {
      errors['cvv'] = 'CVV is required';
    } else if (!VALIDATION_RULES.cvv.test(paymentInfo.cvv)) {
      errors['cvv'] = 'CVV must be 3 or 4 digits';
    }
  }

  /**
   * Validate expiry date format (MM/YY)
   */
  private validateExpiryDate(expiryDate: string): string | null {
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(expiryDate)) {
      return 'Expiry date must be in MM/YY format';
    }

    const [month, year] = expiryDate.split('/');
    const expiry = new Date(2000 + parseInt(year), parseInt(month), 1);
    if (expiry < new Date()) {
      return 'Card has expired';
    }

    return null;
  }

  /**
   * Luhn algorithm for card validation
   */
  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Calculate days between two dates
   */
  private daysBetween(date1: Date, date2: Date): number {
    return Math.floor(
      (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  /**
   * Validate entire booking form
   */
  validateEntireForm(form: BookingForm): Record<number, StepValidationStatus> {
    return {
      1: this.validateVehicleSelection(form.vehicleSelection),
      2: this.validatePlanDetails(form.planDetails),
      3: this.validateBookingDetails(form.bookingDetails),
      4: this.validateKycDetails(form.kycDetails),
      5: this.validatePaymentInfo(form.paymentInfo),
    };
  }
}
