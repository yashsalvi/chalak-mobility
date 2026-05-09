import {
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  CommonModule,
} from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { BookingService, BookingDetails, CancellationResponse } from '../../../services/booking.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-booking-cancellation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
  ],
  templateUrl: './cancellation.html',
  styleUrls: ['./cancellation.css'],
})
export class BookingCancellationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cancellationForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  bookingId = '';
  bookingDetails: any = null;
  cancellationReasons = [
    'Change of plans',
    'Vehicle unavailable',
    'Personal emergency',
    'Weather conditions',
    'Found better alternative',
    'Schedule conflict',
    'Financial constraints',
    'Other (please specify)',
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('id') || '';
    this.initializeForm();
    this.loadBookingDetails();
    
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.cancellationForm = this.fb.group({
      reason: ['', [Validators.required]],
      customReason: [''],
      refundRequested: [false],
      comments: ['', [Validators.maxLength(500)]],
    });

    this.cancellationForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.errorMessage = '';
      });
  }

  private loadBookingDetails(): void {
    if (!this.bookingId) {
      this.errorMessage = 'Invalid booking ID';
      return;
    }

    this.isLoading = true;
    this.bookingService.getBooking(this.bookingId)
      .then((booking: BookingDetails | null) => {
        this.bookingDetails = booking;
        this.isLoading = false;
      })
      .catch((error: any) => {
        this.errorMessage = 'Failed to load booking details';
        this.isLoading = false;
      });
  }

  onSubmit(): void {
    if (this.cancellationForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formData = this.cancellationForm.value;
    const cancellationData = {
      reason: formData.reason === 'Other (please specify)' 
        ? formData.customReason 
        : formData.reason,
      comments: formData.comments,
      requestedBy: 'customer',
      refundRequested: formData.refundRequested,
    };

    this.bookingService.cancelBooking(this.bookingId, cancellationData)
      .then((result: CancellationResponse) => {
        if (result.success) {
          this.router.navigate(['/bookings'], {
            queryParams: {
              cancelled: 'true',
              bookingId: this.bookingId,
            }
          });
        } else {
          this.errorMessage = result.message || 'Cancellation failed';
        }
      })
      .catch((error: any) => {
        this.errorMessage = error instanceof Error ? error.message : 'Cancellation failed';
      })
      .finally(() => {
        this.isSubmitting = false;
      });
  }

  onGoBack(): void {
    this.router.navigate(['/bookings/' + this.bookingId]);
  }

  get reason(): AbstractControl {
    return this.cancellationForm.get('reason')!;
  }

  get customReason(): AbstractControl {
    return this.cancellationForm.get('customReason')!;
  }

  get comments(): AbstractControl {
    return this.cancellationForm.get('comments')!;
  }

  get refundRequested(): AbstractControl {
    return this.cancellationForm.get('refundRequested')!;
  }

  get isCustomReason(): boolean {
    return this.reason.value === 'Other (please specify)';
  }

  getReasonErrorMessage(): string {
    const reason = this.reason;
    if (reason && reason.hasError('required') && reason.touched) {
      return 'Cancellation reason is required';
    }
    return '';
  }

  getCustomReasonErrorMessage(): string {
    const customReason = this.customReason;
    if (this.isCustomReason && customReason && customReason.hasError('required') && customReason.touched) {
      return 'Please specify a reason for cancellation';
    }
    return '';
  }

  // Booking status helpers
  get bookingStatus(): string {
    return this.bookingDetails?.status || 'unknown';
  }

  get canBeCancelled(): boolean {
    const cancellableStatuses = ['draft', 'submitted', 'kyc_pending', 'deposit_pending', 'confirmed'];
    return cancellableStatuses.includes(this.bookingStatus);
  }

  get canBeRefunded(): boolean {
    const refundableStatuses = ['confirmed', 'active', 'completed'];
    const requiresDeposit = ['deposit_pending'];
    return refundableStatuses.includes(this.bookingStatus) && !requiresDeposit.includes(this.bookingStatus);
  }

  get refundPolicy(): string {
    if (!this.bookingDetails) return 'No refund policy available';
    
    const totalCost = this.bookingDetails.costBreakdown?.totalCost || 0;
    const depositPaid = this.bookingDetails.paymentStatus === 'completed';
    
    if (this.bookingStatus === 'confirmed') {
      return 'Full refund available (deposit will be refunded)';
    } else if (this.bookingStatus === 'active') {
      const daysUsed = this.calculateDaysUsed();
      const refundPercentage = this.calculateRefundPercentage(daysUsed);
      return `Partial refund available (${refundPercentage}% of rental cost)`;
    } else if (this.bookingStatus === 'completed') {
      return 'No refund available for completed bookings';
    }
    
    return 'No refund available';
  }

  private calculateDaysUsed(): number {
    if (!this.bookingDetails?.vehicleSelection) return 0;
    
    const startDate = new Date(this.bookingDetails.vehicleSelection.startDate);
    const now = new Date();
    return Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
  }

  private calculateRefundPercentage(daysUsed: number): number {
    if (daysUsed <= 1) return 100;
    if (daysUsed <= 3) return 50;
    if (daysUsed <= 7) return 25;
    if (daysUsed <= 14) return 10;
    return 0;
  }

  // Format helpers
  get formattedBookingDate(): string {
    if (!this.bookingDetails?.vehicleSelection?.startDate) return '';
    return new Date(this.bookingDetails.vehicleSelection.startDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  get formattedTotalCost(): string {
    const cost = this.bookingDetails?.costBreakdown?.totalCost || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(cost);
  }

  get formattedDeposit(): string {
    const deposit = this.bookingDetails?.depositRequired || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(deposit);
  }
}
