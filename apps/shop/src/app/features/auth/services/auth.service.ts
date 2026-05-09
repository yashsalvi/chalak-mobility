import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { catchError, map, tap, timeout, retry } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isKycCompleted: boolean;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  dateOfBirth: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export interface OtpRequest {
  identifier: string;
  purpose: 'login' | 'signup' | 'reset_password';
}

export interface OtpVerification {
  identifier: string;
  otp: string;
  purpose: 'login' | 'signup' | 'reset_password';
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  message?: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  otpSent: boolean;
  otpExpiry?: number;
  attemptsRemaining?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly TOKEN_KEY = 'chalak_auth_tokens';
  private readonly USER_KEY = 'chalak_current_user';
  private readonly maxRetries = 3;
  private readonly timeoutMs = 10000;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private tokensSubject = new BehaviorSubject<AuthTokens | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  tokens$ = this.tokensSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuthFromStorage();
  }

  // Registration
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData).pipe(
      timeout(this.timeoutMs),
      retry(this.maxRetries),
      map(response => {
        if (response.success && response.user && response.token) {
          this.storeTokens(response.token!, response.refreshToken!, response.expiresIn!);
          this.storeUser(response.user!);
          this.setAuthenticated(true);
        }
        return response;
      }),
      catchError(error => this.handleError(error, 'Registration failed'))
    );
  }

  // Login
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      timeout(this.timeoutMs),
      retry(this.maxRetries),
      map(response => {
        if (response.success && response.user && response.token) {
          this.storeTokens(response.token!, response.refreshToken!, response.expiresIn!);
          this.storeUser(response.user!);
          this.setAuthenticated(true);
        }
        return response;
      }),
      catchError(error => this.handleError(error, 'Login failed'))
    );
  }

  // Send OTP
  sendOtp(otpData: OtpRequest): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(`${this.API_URL}/send-otp`, otpData).pipe(
      timeout(this.timeoutMs),
      retry(this.maxRetries),
      catchError(error => this.handleError(error, 'Failed to send OTP'))
    );
  }

  // Verify OTP
  verifyOtp(verificationData: OtpVerification): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/verify-otp`, verificationData).pipe(
      timeout(this.timeoutMs),
      retry(this.maxRetries),
      map(response => {
        if (response.success && response.user && response.token) {
          this.storeTokens(response.token!, response.refreshToken!, response.expiresIn!);
          this.storeUser(response.user!);
          this.setAuthenticated(true);
        }
        return response;
      }),
      catchError(error => this.handleError(error, 'OTP verification failed'))
    );
  }

  // Refresh Token
  refreshToken(): Observable<AuthResponse> {
    const currentTokens = this.tokensSubject.value;
    if (!currentTokens?.refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/refresh-token`, {
      refreshToken: currentTokens.refreshToken
    }).pipe(
      timeout(this.timeoutMs),
      map(response => {
        if (response.success && response.token) {
          this.storeTokens(response.token!, response.refreshToken!, response.expiresIn!);
          // User data remains the same, no need to update
        }
        return response;
      }),
      catchError(error => this.handleError(error, 'Token refresh failed'))
    );
  }

  // Get Profile
  getProfile(): Observable<any> {
    const tokens = this.tokensSubject.value;
    if (!tokens?.accessToken) {
      return throwError(() => new Error('No access token available'));
    }

    return this.http.get(`${this.API_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`
      }
    }).pipe(
      timeout(this.timeoutMs),
      catchError(error => this.handleError(error, 'Failed to fetch profile'))
    );
  }

  // Update Profile
  updateProfile(updateData: any): Observable<any> {
    const tokens = this.tokensSubject.value;
    if (!tokens?.accessToken) {
      return throwError(() => new Error('No access token available'));
    }

    return this.http.put(`${this.API_URL}/profile`, updateData, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`
      }
    }).pipe(
      timeout(this.timeoutMs),
      map((response: any) => {
        if (response.success && response.data) {
          this.storeUser(response.data);
        }
        return response;
      }),
      catchError(error => this.handleError(error, 'Failed to update profile'))
    );
  }

  // Logout
  logout(): void {
    const tokens = this.tokensSubject.value;
    if (tokens?.accessToken) {
      this.http.post(`${this.API_URL}/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`
        }
      }).subscribe({
        next: () => {
          this.clearAuth();
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          // Even if logout API fails, clear local auth
          this.clearAuth();
          this.router.navigate(['/auth/login']);
        }
      });
    } else {
      this.clearAuth();
      this.router.navigate(['/auth/login']);
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is authenticated
  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value && !!this.tokensSubject.value?.accessToken;
  }

  // Get access token
  getAccessToken(): string | null {
    return this.tokensSubject.value?.accessToken || null;
  }

  // Get auth headers for API requests
  getAuthHeaders(): { [key: string]: string } {
    const token = this.getAccessToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Get current user ID
  getUserId(): string {
    const user = this.getCurrentUser();
    return user?.id || '';
  }

  // Check if user has specific role/permission
  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user ? true : false; // Simplified for now
  }

  // Check if user is verified
  isVerified(): boolean {
    const user = this.currentUserSubject.value;
    return user ? (user.isEmailVerified && user.isPhoneVerified) : false;
  }

  // Check if user completed KYC
  isKycCompleted(): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.isKycCompleted : false;
  }

  // Private methods
  private initializeAuthFromStorage(): void {
    try {
      const storedTokens = localStorage.getItem(this.TOKEN_KEY);
      const storedUser = localStorage.getItem(this.USER_KEY);

      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        this.tokensSubject.next(tokens);
      }

      if (storedUser) {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      }
    } catch (error) {
      console.error('[AuthService] Failed to initialize auth from storage:', error);
      this.clearAuth();
    }
  }

  private storeTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn
    };
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
    this.tokensSubject.next(tokens);

    // Set up auto-refresh timer
    this.setupTokenRefresh(expiresIn);
  }

  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private setAuthenticated(authenticated: boolean): void {
    this.isAuthenticatedSubject.next(authenticated);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.tokensSubject.next(null);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  private setupTokenRefresh(expiresIn: number): void {
    // Refresh token 5 minutes before expiry
    const refreshTime = (expiresIn - 300) * 1000;
    const currentTime = Date.now();
    
    if (refreshTime > currentTime) {
      setTimeout(() => {
        this.refreshToken().subscribe({
          error: () => {
            console.warn('[AuthService] Auto token refresh failed');
          }
        });
      }, refreshTime - currentTime);
    }
  }

  private handleError(error: any, defaultMessage: string): Observable<never> {
    let errorMessage = defaultMessage;

    if (error instanceof HttpErrorResponse) {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please check your credentials.';
      } else if (error.status === 0) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = `Server error: ${error.status}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(`[AuthService] ${errorMessage}:`, error);
    return throwError(() => new Error(errorMessage));
  }
}
