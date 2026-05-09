import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, of } from 'rxjs';
import { catchError, map, retry, timeout, mergeMap } from 'rxjs/operators';
import { Vehicle } from '../models/booking.model';

export interface VehicleAvailabilityFilter {
  startDate?: string;
  endDate?: string;
  vehicleType?: Vehicle['type'];
  minPrice?: number;
  maxPrice?: number;
}

export interface VehicleApiResponse {
  success: boolean;
  data: Vehicle[];
  totalAvailable: number;
  filter: VehicleAvailabilityFilter;
  error?: string;
}

export interface VehicleTypesResponse {
  success: boolean;
  data: Vehicle['type'][];
  error?: string;
}

export interface PriceRangeResponse {
  success: boolean;
  data: { min: number; max: number };
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  private readonly apiUrl = '/api/vehicles';
  private readonly maxRetries = 3;
  private readonly timeoutMs = 10000; // 10 seconds

  constructor(private http: HttpClient) {}

  /**
   * Fetch all available vehicles with optional filtering
   */
  getVehicles(filter?: VehicleAvailabilityFilter): Observable<Vehicle[]> {
    const params = this.buildQueryParams(filter);
    
    return this.http.get<VehicleApiResponse>(this.apiUrl, { params }).pipe(
      timeout(this.timeoutMs),
      retry({
        count: this.maxRetries,
        delay: (error, retryIndex) => {
          // Only retry on network errors or 5xx errors
          if (this.shouldRetry(error)) {
            return timer(Math.pow(2, retryIndex) * 1000); // Exponential backoff
          }
          return throwError(() => error);
        },
      }),
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch vehicles');
        }
        return response.data;
      }),
      catchError(error => this.handleError(error, 'Failed to fetch vehicles'))
    );
  }

  /**
   * Get vehicle by ID
   */
  getVehicleById(id: string): Observable<Vehicle> {
    return this.http.get<{ success: boolean; data: Vehicle; error?: string }>(`${this.apiUrl}/${id}`).pipe(
      timeout(this.timeoutMs),
      retry(this.maxRetries),
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Vehicle not found');
        }
        return response.data;
      }),
      catchError(error => this.handleError(error, 'Failed to fetch vehicle'))
    );
  }

  /**
   * Get available vehicle types
   */
  getVehicleTypes(): Observable<Vehicle['type'][]> {
    return this.http.get<VehicleTypesResponse>(`${this.apiUrl}/types`).pipe(
      timeout(this.timeoutMs),
      retry(this.maxRetries),
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch vehicle types');
        }
        return response.data;
      }),
      catchError(error => this.handleError(error, 'Failed to fetch vehicle types'))
    );
  }

  /**
   * Get price range for vehicles
   */
  getPriceRange(): Observable<{ min: number; max: number }> {
    return this.http.get<PriceRangeResponse>(`${this.apiUrl}/price-range`).pipe(
      timeout(this.timeoutMs),
      retry(this.maxRetries),
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch price range');
        }
        return response.data;
      }),
      catchError(error => this.handleError(error, 'Failed to fetch price range'))
    );
  }

  /**
   * Check vehicle availability for specific dates
   */
  checkAvailability(vehicleId: string, startDate: string, endDate: string): Observable<boolean> {
    // Validate input parameters
    if (!vehicleId || !startDate || !endDate) {
      return throwError(() => new Error('Vehicle ID, start date, and end date are required'));
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return throwError(() => new Error('Invalid date format'));
    }

    // Validate date logic
    if (end <= start) {
      return throwError(() => new Error('End date must be after start date'));
    }

    // Check if dates are too far in the future (e.g., more than 1 year)
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
    if (start > maxFutureDate) {
      return throwError(() => new Error('Start date cannot be more than 1 year in the future'));
    }

    // Check if dates are in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    if (start < today) {
      return throwError(() => new Error('Start date cannot be in the past'));
    }

    return this.getVehicles({
      vehicleType: undefined, // We'll filter on the frontend
      startDate,
      endDate,
    }).pipe(
      map(vehicles => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle?.available ?? false;
      }),
      catchError(error => this.handleError(error, 'Failed to check vehicle availability'))
    );
  }

  /**
   * Get vehicles with availability filtering for specific dates
   */
  getAvailableVehicles(startDate: string, endDate: string, vehicleType?: Vehicle['type']): Observable<Vehicle[]> {
    return this.checkAvailability('', startDate, endDate).pipe(
      catchError(() => of(true)), // If date validation fails, return all vehicles
      map(() => true),
      map(() => {
        // If we get here, dates are valid, proceed with vehicle fetch
        return this.getVehicles({
          startDate,
          endDate,
          vehicleType,
        });
      }),
      mergeMap(vehicleObservable => vehicleObservable),
      catchError(error => this.handleError(error, 'Failed to fetch available vehicles'))
    );
  }

  /**
   * Build query parameters from filter object
   */
  private buildQueryParams(filter?: VehicleAvailabilityFilter): { [key: string]: string } {
    const params: { [key: string]: string } = {};
    
    if (!filter) {
      return params;
    }

    if (filter.startDate) {
      params['startDate'] = filter.startDate;
    }
    if (filter.endDate) {
      params['endDate'] = filter.endDate;
    }
    if (filter.vehicleType) {
      params['vehicleType'] = filter.vehicleType;
    }
    if (filter.minPrice !== undefined) {
      params['minPrice'] = filter.minPrice.toString();
    }
    if (filter.maxPrice !== undefined) {
      params['maxPrice'] = filter.maxPrice.toString();
    }

    return params;
  }

  /**
   * Determine if an error is retryable
   */
  private shouldRetry(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      // Retry on network errors or 5xx server errors
      return error.status === 0 || (error.status >= 500 && error.status < 600);
    }
    return false;
  }

  /**
   * Handle HTTP errors with user-friendly messages
   */
  private handleError(error: any, defaultMessage: string): Observable<never> {
    let errorMessage = defaultMessage;

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 0:
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 400:
          errorMessage = 'Invalid request. Please check your input parameters.';
          break;
        case 404:
          errorMessage = 'Vehicle not found.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || defaultMessage;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(`[VehicleService] ${errorMessage}:`, error);
    return throwError(() => new Error(errorMessage));
  }
}
