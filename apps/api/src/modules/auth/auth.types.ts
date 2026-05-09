export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isKycCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  preferences?: UserProfile['preferences'];
}

export interface CreateUserRequest {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  dateOfBirth: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export interface LoginRequest {
  identifier: string; // email or phone
  password: string;
  rememberMe?: boolean;
}

export interface OtpRequest {
  identifier: string; // email or phone
  purpose: 'login' | 'signup' | 'reset_password';
}

export interface OtpVerification {
  identifier: string;
  otp: string;
  purpose: 'login' | 'signup' | 'reset_password';
}

export interface AuthResponse {
  success: boolean;
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
  expiresIn: number; // seconds
  message?: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  otpSent: boolean;
  otpExpiry?: number; // seconds until expiry
  attemptsRemaining?: number;
}

export interface UserProfile {
  user: Omit<User, 'password'>;
  stats: {
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
    averageRating: number;
  };
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    preferredLanguage: string;
    currency: string;
  };
}

export interface PasswordResetRequest {
  identifier: string;
  newPassword: string;
  otp: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  preferences?: Partial<UserProfile['preferences']>;
}
