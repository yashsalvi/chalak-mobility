import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../features/auth/services/auth.service';

export interface BookingDetails {
  bookingId: string;
  bookingReference: string;
  vehicleName: string;
  status: string;
  costBreakdown: {
    rentalCost: number;
    insuranceCost: number;
    addOnsCost: number;
    taxAmount: number;
    discountAmount: number;
    totalCost: number;
  };
  depositRequired: number;
  paymentStatus: string;
  vehicleSelection: {
    vehicleType: string;
    vehicleId: string;
    startDate: string;
    endDate: string;
    rentalDays: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CancellationRequest {
  reason: string;
  comments?: string;
  requestedBy: string;
  refundRequested: boolean;
}

export interface CancellationResponse {
  success: boolean;
  message?: string;
  refundAmount?: number;
  refundStatus?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly apiUrl = 'http://localhost:3333/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  async getBooking(bookingId: string): Promise<BookingDetails | null> {
    try {
      return await lastValueFrom(
        this.http.get<BookingDetails>(`${this.apiUrl}/bookings/${bookingId}`)
          .pipe(
            catchError(error => {
              console.error('Failed to fetch booking:', error);
              throw new Error('Failed to fetch booking details');
            })
          )
      );
    } catch (error) {
      return null;
    }
  }

  async cancelBooking(bookingId: string, cancellationData: CancellationRequest): Promise<CancellationResponse> {
    const headers = this.authService.getAuthHeaders();
    
    try {
      return await lastValueFrom(
        this.http.post<CancellationResponse>(
          `${this.apiUrl}/bookings/${bookingId}/cancel`,
          cancellationData,
          { headers }
        )
          .pipe(
            catchError(error => {
              console.error('Failed to cancel booking:', error);
              throw new Error('Booking cancellation failed');
            })
          )
      );
    } catch (error) {
      throw new Error('Booking cancellation failed');
    }
  }

  async getUserBookings(): Promise<BookingDetails[]> {
    const headers = this.authService.getAuthHeaders();
    const params = new HttpParams().set('userId', this.authService.getUserId());
    
    try {
      return await lastValueFrom(
        this.http.get<BookingDetails[]>(`${this.apiUrl}/bookings`, { headers, params })
          .pipe(
            catchError(error => {
              console.error('Failed to fetch user bookings:', error);
              throw new Error('Failed to fetch bookings');
            })
          )
      );
    } catch (error) {
      return [];
    }
  }

  async getBookingStatus(bookingId: string): Promise<{ status: string; nextAction: string } | null> {
    try {
      return await lastValueFrom(
        this.http.get<{ status: string; nextAction: string }>(`${this.apiUrl}/bookings/${bookingId}/status`)
          .pipe(
            catchError(error => {
              console.error('Failed to fetch booking status:', error);
              throw new Error('Failed to fetch booking status');
            })
          )
      );
    } catch (error) {
      return null;
    }
  }
}
