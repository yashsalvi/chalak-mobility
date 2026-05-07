import { Component, Input, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BookingApiService, BookingSummary } from '../../features/home/booking/services/booking-api.service';

interface Booking {
  id: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  status: 'confirmed' | 'pending' | 'completed';
  totalCost: number;
}

@Component({
  selector: 'app-recent-bookings',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './recent-bookings.html',
  styleUrl: './recent-bookings.css',
})
export class RecentBookings implements OnInit {
  @Input() compact = false;
  bookings: Booking[] = [];
  hasBookings = false;
  isBrowser = false;
  private readonly bookingApi: BookingApiService;
  private readonly router: Router;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    bookingApi: BookingApiService,
    router: Router
  ) {
    this.bookingApi = bookingApi;
    this.router = router;
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.loadRecentBookings();
    }
  }

  loadRecentBookings() {
    const sessionId = localStorage.getItem('booking-session-id');
    if (!sessionId) {
      this.hasBookings = false;
      return;
    }

    this.bookingApi.getBookings(sessionId).subscribe({
      next: (bookings: BookingSummary[]) => {
        this.bookings = bookings.map((booking) => ({
          id: booking.bookingReference,
          vehicleName: booking.vehicleName,
          startDate: booking.startDate,
          endDate: booking.endDate,
          status: booking.status === 'confirmed' ? 'confirmed' : booking.status === 'completed' ? 'completed' : 'pending',
          totalCost: booking.totalCost,
        }));
        this.hasBookings = this.bookings.length > 0;
      },
      error: () => {
        this.hasBookings = false;
      },
    });
  }

  getStatusIcon(status: string) {
    return status === 'confirmed' ? 'check-circle' : status === 'pending' ? 'clock' : 'check-circle';
  }

  getStatusClass(status: string) {
    return `status-${status}`;
  }

  viewBooking(booking: Booking) {
    this.router.navigate(['/bookings', booking.id]);
  }

  newBooking() {
    this.router.navigate(['/booking']);
  }
}
