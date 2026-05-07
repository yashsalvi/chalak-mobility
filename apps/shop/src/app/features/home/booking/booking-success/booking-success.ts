import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, retry } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { BookingApiService, BookingDetailsResponse } from '../services/booking-api.service';
import { BookingResponse } from '../models/booking.model';

/**
 * Booking Success Component
 * Displays booking confirmation with server-returned details
 * CRITICAL: Uses server response for totals, deposit, penalties, status
 * Calls GET /api/bookings/:id on mount/refresh to reload current status
 */
@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './booking-success.html',
  styleUrls: ['./booking-success.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingSuccess implements OnInit, OnDestroy {
  @Input() bookingResponse: BookingResponse | null = null;

  private readonly bookingApi = inject(BookingApiService);
  private readonly router = inject(Router);
  private destroy$ = new Subject<void>();

  // Loaded booking details from server
  bookingDetails: BookingDetailsResponse | null = null;
  isLoading = false;
  error: string | null = null;

  // Display helpers
  statusBadgeClass = '';
  nextActionText = '';
  showWarning = false;

  ngOnInit(): void {
    const identifier =
      this.bookingResponse?.bookingId ?? this.bookingResponse?.bookingReference;
    if (identifier) {
      this.loadBookingDetails(identifier);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load booking details from server
   * Called on component init to get current status
   * This ensures user sees accurate status even if page is refreshed
   */
  private loadBookingDetails(bookingId: string): void {
    this.isLoading = true;
    this.error = null;

    this.bookingApi
      .getBooking(bookingId)
      .pipe(
        retry({ count: 2, delay: 1000 }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (details) => {
          this.bookingDetails = details;
          this.updateStatusDisplay(details.status);
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.error || 'Failed to load booking details';
          console.error('[BookingSuccess]', error);
          this.isLoading = false;
        },
      });
  }

  /**
   * Update UI based on booking status
   * Show appropriate badge color and next action message
   */
  private updateStatusDisplay(status: string): void {
    switch (status) {
      case 'confirmed':
        this.statusBadgeClass = 'status--confirmed';
        this.nextActionText = 'Your booking is confirmed. Check your email for details.';
        break;
      case 'kyc_pending':
        this.statusBadgeClass = 'status--pending';
        this.nextActionText = 'Please complete KYC verification to activate your booking.';
        this.showWarning = true;
        break;
      case 'deposit_pending':
        this.statusBadgeClass = 'status--pending';
        this.nextActionText = 'Deposit payment is pending. Complete payment to confirm.';
        this.showWarning = true;
        break;
      case 'active':
        this.statusBadgeClass = 'status--active';
        this.nextActionText = 'Your rental is now active. Enjoy your ride!';
        break;
      case 'completed':
        this.statusBadgeClass = 'status--completed';
        this.nextActionText = 'Your rental has been completed successfully.';
        break;
      default:
        this.statusBadgeClass = 'status--draft';
        this.nextActionText = 'Your booking is being processed.';
    }
  }

  /**
   * Refresh booking status
   * User can manually check for updates
   */
  refreshBookingStatus(): void {
    const identifier =
      this.bookingResponse?.bookingId ?? this.bookingResponse?.bookingReference;
    if (identifier) {
      this.loadBookingDetails(identifier);
    }
  }

  /**
   * Copy the booking reference to clipboard
   */
  copyBookingReference(): void {
    if (!this.bookingDetails?.bookingReference) {
      return;
    }
    navigator.clipboard
      .writeText(this.bookingDetails.bookingReference)
      .catch(() => {
        console.warn('Clipboard copy failed.');
      });
  }

  /**
   * Navigate to my bookings page
   */
  viewAllBookings(): void {
    // TODO: Implement proper bookings list page with authentication
    // For now, show a message that this feature is coming soon
    alert('Bookings list page coming soon! This will require user authentication.');
  }

  /**
   * Download receipt (future enhancement)
   */
  downloadReceipt(): void {
    if (!this.bookingDetails) return;

    const receiptData = `
Booking Reference: ${this.bookingDetails.bookingReference}
Status: ${this.bookingDetails.status}
Date: ${new Date(this.bookingDetails.createdAt).toLocaleDateString()}

Vehicle: ${this.bookingDetails.vehicleName}
Rental Period: ${this.bookingDetails.startDate} to ${this.bookingDetails.endDate}
Days: ${this.bookingDetails.rentalDays}

COST BREAKDOWN:
- Rental Cost: ₹${this.bookingDetails.costBreakdown.rentalCost}
- Insurance (${this.bookingDetails.insuranceType}): ₹${this.bookingDetails.costBreakdown.insuranceCost}
- Addons: ₹${this.bookingDetails.costBreakdown.addonsCost}
- Subtotal: ₹${this.bookingDetails.costBreakdown.subtotal}
- Tax (10%): ₹${this.bookingDetails.costBreakdown.taxAmount}
- Total: ₹${this.bookingDetails.costBreakdown.totalCost}

DEPOSIT & PENALTIES:
- Security Deposit: ₹${this.bookingDetails.deposit}
- Late Return Fine/Day: ₹${this.bookingDetails.lateReturnFinePerDay}
- Damage Fine: ₹${this.bookingDetails.damageFine}

TERMS ACCEPTED:
- Agreement Version: ${this.bookingDetails.agreementVersion}
- Accepted At: ${new Date(this.bookingDetails.agreementAcceptedAt || '').toLocaleString()}
- Penalty Policy: ${this.bookingDetails.penaltyPolicyAccepted ? 'Accepted' : 'Not Accepted'}
    `;

    const blob = new Blob([receiptData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${this.bookingDetails.bookingReference}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get fraud risk label for display
   */
  getFraudRiskLabel(): string {
    if (!this.bookingDetails?.fraudFlags) return 'Low';

    const score = this.bookingDetails.fraudFlags.riskScore;
    if (score < 30) return 'Low';
    if (score < 60) return 'Medium';
    return 'High';
  }

  /**
   * Helper to format currency
   */
  formatCurrency(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  }
}
