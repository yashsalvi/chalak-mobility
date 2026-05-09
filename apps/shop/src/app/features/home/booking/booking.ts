import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

import { BookingVehicle } from './booking-vehicle/booking-vehicle';
import { BookingPlan } from './booking-plan/booking-plan';
import { BookingDetailsComponent } from './booking-details/booking-details';
import { BookingKyc } from './booking-kyc/booking-kyc';
import { BookingPaymentComponent } from './booking-payment/booking-payment';
import { BookingSuccess } from './booking-success/booking-success';
import { BookingApiService } from './services/booking-api.service';
import { BookingStepperService } from './services/booking-stepper.service';
import {
  BookingForm,
  NavigationState,
  BOOKING_CONFIG,
  VehicleSelection,
  PlanDetails,
  BookingDetails,
  KycDetails,
  PaymentInfo,
  BookingResponse,
} from './models/booking.model';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    BookingVehicle,
    BookingPlan,
    BookingDetailsComponent,
    BookingKyc,
    BookingPaymentComponent,
    BookingSuccess,
  ],
  templateUrl: './booking.html',
  styleUrl: './booking.css',
})
export class Booking implements OnInit, OnDestroy {
  private readonly stepperService = inject(BookingStepperService);
  private readonly bookingApiService = inject(BookingApiService);

  // Observable streams
  bookingForm$ = this.stepperService.getBookingForm$();
  navigationState$ = this.stepperService.getNavigationState$();
  error$ = this.stepperService.getError$();
  isLoading$ = this.stepperService.isLoading$();

  // Local state
  currentStep = 1;
  stepValidationErrors: Record<string, string> = {};
  canProceed = true;
  canGoBack = false;
  showConfirmation = false;
  confirmationMessage = '';
  bookingResponse: BookingResponse | null = null;

  // Configuration
  readonly STEP_COUNT = BOOKING_CONFIG.STEP_COUNT;
  readonly COMPLETION_STEP = BOOKING_CONFIG.COMPLETION_STEP;
  private readonly stepLabels = ['Vehicle', 'Plan', 'Details', 'KYC', 'Payment', 'Confirmation'];

  private destroy$ = new Subject<void>();
  private navigationStack: number[] = [1]; // Track navigation history
  private attemptedSteps = new Set<number>();

  ngOnInit(): void {
    // Subscribe to navigation state changes
    this.navigationState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: NavigationState) => {
        this.currentStep = state.currentStep;
        this.canGoBack = state.canGoBack;
        this.refreshCanProceed();
        this.updateStepValidationErrors();
      });

    this.bookingForm$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshCanProceed());

    // Handle browser back button prevention
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  /**
   * Navigate to next step with validation
   */
  next(): void {
    try {
      // Validate current step
      if (!this.stepperService.isStepValid(this.currentStep)) {
        this.attemptedSteps.add(this.currentStep);
        this.stepValidationErrors = this.stepperService.getStepErrors(
          this.currentStep
        );
        this.showConfirmation = false;
        return;
      }

      // Track navigation
      this.navigationStack.push(this.currentStep + 1);

      // Navigate to next step
      const success = this.stepperService.nextStep();
      if (!success) {
        this.showErrorNotification('Cannot proceed to next step');
      }
    } catch (error) {
      this.showErrorNotification('An error occurred while proceeding');
      console.error('Navigation error:', error);
    }
  }

  /**
   * Navigate to previous step
   */
  prev(): void {
    try {
      // Pop from navigation stack
      if (this.navigationStack.length > 1) {
        this.navigationStack.pop();
      }

      const success = this.stepperService.previousStep();
      if (!success) {
        this.showErrorNotification('Cannot go back');
      }
    } catch (error) {
      this.showErrorNotification('An error occurred while going back');
      console.error('Navigation error:', error);
    }
  }

  /**
   * Jump directly to a specific step (for non-sequential navigation)
   */
  jumpToStep(step: number): void {
    try {
      if (step < 1 || step > this.STEP_COUNT) {
        return;
      }

      // Validate and navigate
      this.stepperService.navigateToStep(step);
    } catch (error) {
      console.error('Jump navigation error:', error);
    }
  }

  onVehicleStepComplete(data: VehicleSelection): void {
    this.stepperService.updateVehicleSelection(data);
    this.next();
  }

  onPlanStepComplete(data: PlanDetails): void {
    this.stepperService.updatePlanDetails(data);
    this.next();
  }

  onDetailsStepComplete(data: BookingDetails): void {
    this.stepperService.updateBookingDetails(data);
    this.next();
  }

  onKycStepComplete(data: KycDetails): void {
    this.stepperService.updateKycDetails(data);
    this.next();
  }

  onPaymentStepComplete(data: PaymentInfo): void {
    this.stepperService.updatePaymentInfo(data);
    this.submitBooking();
  }

  /**
   * Final submit after payment step (form is read from the stepper service).
   */
  async submitBooking(): Promise<void> {
    try {
      if (!this.stepperService.isStepValid(this.STEP_COUNT)) {
        this.showErrorNotification('Please complete all required fields');
        return;
      }

      const form = await firstValueFrom(this.bookingForm$);
      this.bookingResponse = await firstValueFrom(
        this.bookingApiService.submitBooking(form)
      );
      this.showConfirmation = true;
      this.confirmationMessage = `Booking completed successfully! Ref: ${this.bookingResponse.bookingReference}`;
      this.stepperService.markAsSaved();
      this.stepperService.navigateToStep(this.COMPLETION_STEP);
    } catch (error) {
      this.showErrorNotification('Failed to submit booking');
      console.error('Submission error:', error);
    }
  }

  /**
   * Reset entire booking
   */
  resetBooking(): void {
    if (
      confirm(
        'Are you sure you want to reset the booking? All progress will be lost.'
      )
    ) {
      this.stepperService.reset();
      this.navigationStack = [1];
      this.stepValidationErrors = {};
      this.attemptedSteps.clear();
      this.showConfirmation = false;
    }
  }

  /**
   * Get step label
   */
  getStepLabel(step: number): string {
    return this.stepLabels[step - 1] || '';
  }

  /**
   * Check if step is completed
   */
  isStepCompleted(step: number): boolean {
    const navState = (this.navigationState$ as any).value;
    return navState?.completedSteps?.includes(step) || false;
  }

  /**
   * Check if step is visited
   */
  isStepVisited(step: number): boolean {
    const navState = (this.navigationState$ as any).value;
    return navState?.visitedSteps?.includes(step) || false;
  }

  /**
   * Get button labels
   */
  getBackButtonLabel(): string {
    return 'Back';
  }

  getNextButtonLabel(): string {
    if (this.currentStep === this.STEP_COUNT) {
      return 'Submit';
    }
    return 'Next';
  }

  /**
   * Private helper: Update step validation errors
   */
  private updateStepValidationErrors(): void {
    if (!this.attemptedSteps.has(this.currentStep)) {
      this.stepValidationErrors = {};
      return;
    }

    this.stepValidationErrors = this.stepperService.getStepErrors(this.currentStep);
  }

  private refreshCanProceed(): void {
    this.canProceed =
      this.currentStep < this.COMPLETION_STEP &&
      this.stepperService.isStepValid(this.currentStep);
  }

  /**
   * Private helper: Show error notification
   */
  private showErrorNotification(message: string): void {
    this.confirmationMessage = message;
    this.showConfirmation = true;
    setTimeout(() => {
      this.showConfirmation = false;
    }, 5000);
  }

  /**
   * Handle before unload (unsaved changes warning)
   */
  private handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.stepperService.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
