/**
 * Booking Stepper State Service
 * Manages booking form state, navigation, and persistence
 * Production-ready with comprehensive error handling and edge cases
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  BookingForm,
  VehicleSelection,
  PlanDetails,
  BookingDetails,
  KycDetails,
  PaymentInfo,
  BookingCost,
  NavigationState,
  BOOKING_CONFIG,
  INSURANCE_PLANS,
  ADDON_COSTS,
  InsurancePlan,
} from '../models/booking.model';
import { BookingValidationService } from './booking-validation.service';

@Injectable({
  providedIn: 'root',
})
export class BookingStepperService {
  private readonly STORAGE_KEY = 'booking_form_draft';
  private readonly NAVIGATION_STATE_KEY = 'booking_navigation_state';
  private readonly MAX_AUTO_SAVE_SIZE = 50 * 1024; // 50KB

  private bookingForm$ = new BehaviorSubject<BookingForm>(
    this.getInitialForm()
  );
  private navigationState$ = new BehaviorSubject<NavigationState>(
    this.getInitialNavigationState()
  );
  private error$ = new BehaviorSubject<string | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  constructor(private validationService: BookingValidationService) {
    this.initializeFromStorage();
  }

  /**
   * Get current booking form
   */
  getBookingForm$(): Observable<BookingForm> {
    return this.bookingForm$.asObservable();
  }

  /**
   * Get current navigation state
   */
  getNavigationState$(): Observable<NavigationState> {
    return this.navigationState$.asObservable();
  }

  /**
   * Get errors
   */
  getError$(): Observable<string | null> {
    return this.error$.asObservable();
  }

  /**
   * Get loading state
   */
  isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  /**
   * Update vehicle selection
   */
  updateVehicleSelection(vehicleSelection: Partial<VehicleSelection>): void {
    try {
      const current = this.bookingForm$.value;
      const updated = {
        ...current,
        vehicleSelection: {
          ...current.vehicleSelection,
          ...vehicleSelection,
        },
      };

      // Recalculate costs if dates/vehicle changed
      if (
        vehicleSelection.vehicleId ||
        vehicleSelection.startDate ||
        vehicleSelection.endDate
      ) {
        updated.costBreakdown = this.recalculateCosts(updated);
      }

      this.bookingForm$.next(updated);
      this.autoSaveToStorage();
      this.error$.next(null);
    } catch (error) {
      this.handleError('Failed to update vehicle selection', error);
    }
  }

  /**
   * Update plan details
   */
  updatePlanDetails(planDetails: Partial<PlanDetails>): void {
    try {
      const current = this.bookingForm$.value;
      const updated = {
        ...current,
        planDetails: {
          ...current.planDetails,
          ...planDetails,
        },
      };

      // Recalculate costs if insurance or addons changed
      if (
        planDetails.insuranceType !== undefined ||
        planDetails.addons !== undefined ||
        planDetails.rideType !== undefined
      ) {
        updated.costBreakdown = this.recalculateCosts(updated);
      }

      this.bookingForm$.next(updated);
      this.autoSaveToStorage();
      this.error$.next(null);
    } catch (error) {
      this.handleError('Failed to update plan details', error);
    }
  }

  /**
   * Update booking details
   */
  updateBookingDetails(bookingDetails: Partial<BookingDetails>): void {
    try {
      const current = this.bookingForm$.value;
      this.bookingForm$.next({
        ...current,
        bookingDetails: {
          ...current.bookingDetails,
          ...bookingDetails,
        },
      });
      this.autoSaveToStorage();
      this.error$.next(null);
    } catch (error) {
      this.handleError('Failed to update booking details', error);
    }
  }

  /**
   * Update payment info
   */
  updatePaymentInfo(paymentInfo: Partial<PaymentInfo>): void {
    try {
      const current = this.bookingForm$.value;
      this.bookingForm$.next({
        ...current,
        paymentInfo: {
          ...current.paymentInfo,
          ...paymentInfo,
        },
      });
      this.autoSaveToStorage();
      this.error$.next(null);
    } catch (error) {
      this.handleError('Failed to update payment info', error);
    }
  }

  /**
   * Update KYC and agreements details
   */
  updateKycDetails(kycDetails: Partial<KycDetails>): void {
    try {
      const current = this.bookingForm$.value;
      this.bookingForm$.next({
        ...current,
        kycDetails: {
          ...current.kycDetails,
          ...kycDetails,
        },
      });
      this.autoSaveToStorage();
      this.error$.next(null);
    } catch (error) {
      this.handleError('Failed to update KYC details', error);
    }
  }

  /**
   * Navigate to step with validation
   */
  navigateToStep(step: number): boolean {
    try {
      const navState = this.navigationState$.value;
      const form = this.bookingForm$.value;

      // Validate current step before proceeding
      if (step > navState.currentStep) {
        const validation = this.validationService.validateEntireForm(form);
        const currentStepValidation = validation[navState.currentStep];

        if (!currentStepValidation?.isValid) {
          this.error$.next(
            `Please complete step ${navState.currentStep} before proceeding`
          );
          return false;
        }
      }

      // Check bounds
      if (step < 1 || step > BOOKING_CONFIG.COMPLETION_STEP) {
        return false;
      }

      // Update navigation state
      const newNavState: NavigationState = {
        ...navState,
        currentStep: step,
        completedSteps: [...new Set([...navState.completedSteps, navState.currentStep])],
        visitedSteps: [...new Set([...navState.visitedSteps, step])],
        canProceed: step < BOOKING_CONFIG.COMPLETION_STEP,
        canGoBack: step > 1,
      };

      this.navigationState$.next(newNavState);
      this.autoSaveToStorage();
      this.error$.next(null);
      return true;
    } catch (error) {
      this.handleError('Failed to navigate to step', error);
      return false;
    }
  }

  /**
   * Go to next step
   */
  nextStep(): boolean {
    const currentStep = this.navigationState$.value.currentStep;
    if (currentStep < BOOKING_CONFIG.COMPLETION_STEP) {
      return this.navigateToStep(currentStep + 1);
    }
    return false;
  }

  /**
   * Go to previous step
   */
  previousStep(): boolean {
    const currentStep = this.navigationState$.value.currentStep;
    if (currentStep > 1) {
      return this.navigateToStep(currentStep - 1);
    }
    return false;
  }

  /**
   * Check if step is valid
   */
  isStepValid(step: number): boolean {
    const validation = this.validationService.validateEntireForm(
      this.bookingForm$.value
    );
    return validation[step]?.isValid ?? false;
  }

  /**
   * Get step validation errors
   */
  getStepErrors(step: number): Record<string, string> {
    const validation = this.validationService.validateEntireForm(
      this.bookingForm$.value
    );
    return validation[step]?.errors ?? {};
  }

  /**
   * Mark step as touched
   */
  markStepTouched(step: number): void {
    const navState = this.navigationState$.value;
    if (!navState.visitedSteps.includes(step)) {
      this.navigationState$.next({
        ...navState,
        visitedSteps: [...new Set([...navState.visitedSteps, step])],
      });
      this.autoSaveToStorage();
    }
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    try {
      this.bookingForm$.next(this.getInitialForm());
      this.navigationState$.next(this.getInitialNavigationState());
      this.error$.next(null);
      this.clearStorage();
    } catch (error) {
      this.handleError('Failed to reset booking form', error);
    }
  }

  /**
   * Check if form has unsaved changes
   */
  hasUnsavedChanges(): boolean {
    return this.navigationState$.value.hasUnsavedChanges;
  }

  /**
   * Mark form as saved
   */
  markAsSaved(): void {
    const navState = this.navigationState$.value;
    this.navigationState$.next({
      ...navState,
      hasUnsavedChanges: false,
    });
  }

  /**
   * Get form summary for review
   */
  getFormSummary(): Partial<BookingForm> {
    return {
      vehicleSelection: this.bookingForm$.value.vehicleSelection,
      planDetails: this.bookingForm$.value.planDetails,
      bookingDetails: this.bookingForm$.value.bookingDetails,
      kycDetails: this.bookingForm$.value.kycDetails,
      costBreakdown: this.bookingForm$.value.costBreakdown,
    };
  }

  /**
   * Private helper: Get initial form
   */
  private getInitialForm(): BookingForm {
    return {
      vehicleSelection: {
        vehicleId: null,
        startDate: null,
        endDate: null,
        rentalDays: 0,
        estimatedCost: 0,
      },
      planDetails: {
        insuranceType: null,
        rideType: null,
        addons: [],
      },
      bookingDetails: {
        contactInfo: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          phoneCountryCode: '+91',
          dateOfBirth: null,
          licenseNumber: '',
          licenseCountry: 'IN',
          licenseExpiryDate: null,
        },
        pickupLocation: {
          locationType: 'hub',
        },
        dropoffLocation: {
          locationType: 'hub',
        },
        specialRequests: '',
      },
      kycDetails: {
        aadhaarNumber: '',
        aadhaarVerificationStatus: 'pending',
        drivingLicenseUploadStatus: 'pending',
        drivingLicenseDocumentId: '',
        agreeToTerms: false,
        agreeToPenaltyPolicy: false,
        agreementVersion: 'v1.0.0',
      },
      paymentInfo: {
        method: null,
        saveCard: false,
        agreeToAutomaticPayment: false,
      },
      costBreakdown: {
        rentalCost: 0,
        insuranceCost: 0,
        addOnsCost: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalCost: 0,
      },
      createdAt: new Date(),
    };
  }

  /**
   * Private helper: Get initial navigation state
   */
  private getInitialNavigationState(): NavigationState {
    return {
      currentStep: 1,
      completedSteps: [],
      visitedSteps: [1],
      canProceed: true,
      canGoBack: false,
      hasUnsavedChanges: false,
    };
  }

  /**
   * Private helper: Recalculate costs
   */
  private recalculateCosts(form: BookingForm): BookingCost {
    const { vehicleSelection, planDetails } = form;

    // Rental cost
    let rentalCost = 0;
    if (vehicleSelection.selectedVehicle && vehicleSelection.rentalDays > 0) {
      rentalCost =
        vehicleSelection.selectedVehicle.pricePerDay *
        vehicleSelection.rentalDays;
    }

    // Insurance cost
    let insuranceCost = 0;
    if (planDetails.insuranceType) {
      const key = planDetails.insuranceType as InsurancePlan;
      const insurancePlan = INSURANCE_PLANS[key];
      insuranceCost = insurancePlan.cost * vehicleSelection.rentalDays;
    }

    // Add-ons cost (flat per rental, same as plan step UI)
    const addOnsCost = (planDetails.addons || []).reduce(
      (sum, id) => sum + (ADDON_COSTS[id] ?? 0),
      0
    );

    // Subtotal
    const subtotal = rentalCost + insuranceCost + addOnsCost;

    // Tax (10%)
    const taxAmount = Math.round(subtotal * BOOKING_CONFIG.TAX_RATE * 100) / 100;

    // Discount (example: 10% if rental > 7 days)
    let discountAmount = 0;
    if (vehicleSelection.rentalDays > 7) {
      discountAmount = Math.round(subtotal * 0.1 * 100) / 100;
    }

    // Total cost
    const totalCost = subtotal + taxAmount - discountAmount;

    return {
      rentalCost: Math.round(rentalCost * 100) / 100,
      insuranceCost: Math.round(insuranceCost * 100) / 100,
      addOnsCost: Math.round(addOnsCost * 100) / 100,
      taxAmount,
      discountAmount,
      totalCost: Math.round(totalCost * 100) / 100,
    };
  }

  /**
   * Private helper: Auto-save to localStorage
   */
  private autoSaveToStorage(): void {
    try {
      const form = this.bookingForm$.value;
      const navState = this.navigationState$.value;

      // Check storage size before saving
      const serialized = JSON.stringify({
        form,
        navState,
      });

      if (serialized.length > this.MAX_AUTO_SAVE_SIZE) {
        console.warn(
          'Booking form draft exceeded max storage size. Not saving.'
        );
        return;
      }

      localStorage.setItem(this.STORAGE_KEY, serialized);
      localStorage.setItem(
        this.NAVIGATION_STATE_KEY,
        JSON.stringify({ ...navState, hasUnsavedChanges: false })
      );

      this.navigationState$.next({
        ...navState,
        hasUnsavedChanges: false,
      });
    } catch (error) {
      console.error('Failed to save booking draft:', error);
      // Don't throw - auto-save failure shouldn't block user
    }
  }

  /**
   * Private helper: Initialize from storage
   */
  private initializeFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const { form, navState } = JSON.parse(stored);

        // Validate stored data structure
        if (this.isValidStoredForm(form)) {
          this.bookingForm$.next(form);
          this.navigationState$.next({
            ...(navState || this.getInitialNavigationState()),
            hasUnsavedChanges: false,
          });
        }
      }
    } catch (error) {
      console.warn('Failed to restore booking draft from storage:', error);
      // Continue with initial state
    }
  }

  /**
   * Private helper: Validate stored form structure
   */
  private isValidStoredForm(form: any): boolean {
    return (
      form &&
      form.vehicleSelection &&
      form.planDetails &&
      form.bookingDetails &&
      form.kycDetails &&
      form.paymentInfo &&
      form.costBreakdown
    );
  }

  /**
   * Private helper: Clear storage
   */
  private clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.NAVIGATION_STATE_KEY);
    } catch (error) {
      console.error('Failed to clear booking storage:', error);
    }
  }

  /**
   * Private helper: Handle errors
   */
  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.error$.next(message);
  }
}
