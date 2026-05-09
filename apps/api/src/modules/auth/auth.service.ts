import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { 
  User, 
  CreateUserRequest, 
  LoginRequest, 
  OtpRequest, 
  OtpVerification, 
  AuthResponse, 
  OtpResponse,
  UserProfile,
  PasswordResetRequest,
  RefreshTokenRequest,
  UpdateProfileRequest
} from './auth.types';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'node:url';

// Helper function to get __dirname in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In-memory storage (in production, use proper database)
const usersFile = path.join(__dirname, 'users.db.json');
const sessionsFile = path.join(__dirname, 'sessions.db.json');
const otpStore = new Map<string, { otp: string; expiry: Date; attempts: number; purpose: string }>();
const refreshTokens = new Map<string, { userId: string; expiry: Date }>();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = 60 * 60 * 24; // 24 hours
const REFRESH_TOKEN_EXPIRES_IN = 60 * 60 * 24 * 30; // 30 days
const OTP_EXPIRES_IN = 10 * 60; // 10 minutes
const MAX_OTP_ATTEMPTS = 3;

export class AuthService {
  private users: User[] = [];
  private sessions: Map<string, { userId: string; token: string; expiry: Date }> = new Map();

  constructor() {
    this.loadUsers();
    this.loadSessions();
  }

  // User Registration
  async register(userData: CreateUserRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = this.users.find(u => 
      u.email === userData.email || u.phone === userData.phone
    );
    
    if (existingUser) {
      throw new Error('User with this email or phone already exists');
    }

    // Validate terms agreement
    if (!userData.agreeToTerms || !userData.agreeToPrivacy) {
      throw new Error('You must agree to terms and privacy policy');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate phone format (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
    if (!phoneRegex.test(userData.phone)) {
      throw new Error('Invalid phone format');
    }

    // Validate password strength
    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const user: User = {
      id: randomUUID(),
      email: userData.email,
      phone: userData.phone,
      firstName: userData.firstName,
      lastName: userData.lastName,
      dateOfBirth: userData.dateOfBirth,
      isEmailVerified: false,
      isPhoneVerified: false,
      isKycCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.push(user);
    this.saveUsers();

    // Generate OTP for email verification
    const otp = this.generateOtp();
    otpStore.set(userData.email, {
      otp,
      expiry: new Date(Date.now() + OTP_EXPIRES_IN * 1000),
      attempts: 0,
      purpose: 'signup'
    });

    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store session
    this.sessions.set(token, {
      userId: user.id,
      token,
      expiry: new Date(Date.now() + JWT_EXPIRES_IN * 1000)
    });

    return {
      success: true,
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
      message: 'Registration successful. Please verify your email.'
    };
  }

  // User Login
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const user = this.users.find(u => 
      u.email === loginData.identifier || u.phone === loginData.identifier
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // In a real app, you'd hash and compare passwords
    // For demo, we'll accept any password for existing users
    if (loginData.password.length < 1) {
      throw new Error('Password is required');
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    this.saveUsers();

    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store session
    this.sessions.set(token, {
      userId: user.id,
      token,
      expiry: new Date(Date.now() + JWT_EXPIRES_IN * 1000)
    });

    return {
      success: true,
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN
    };
  }

  // Send OTP
  async sendOtp(otpData: OtpRequest): Promise<OtpResponse> {
    const user = this.users.find(u => 
      u.email === otpData.identifier || u.phone === otpData.identifier
    );

    // For signup, user should not exist yet
    if (otpData.purpose === 'signup' && user) {
      throw new Error('User already exists');
    }

    // For login/reset, user should exist
    if ((otpData.purpose === 'login' || otpData.purpose === 'reset_password') && !user) {
      throw new Error('User not found');
    }

    const existingOtp = otpStore.get(otpData.identifier);
    if (existingOtp && existingOtp.expiry > new Date()) {
      const timeRemaining = Math.floor((existingOtp.expiry.getTime() - Date.now()) / 1000);
      return {
        success: false,
        message: `OTP already sent. Please wait ${timeRemaining} seconds before requesting another.`,
        otpSent: false,
        attemptsRemaining: MAX_OTP_ATTEMPTS - existingOtp.attempts
      };
    }

    const otp = this.generateOtp();
    otpStore.set(otpData.identifier, {
      otp,
      expiry: new Date(Date.now() + OTP_EXPIRES_IN * 1000),
      attempts: 0,
      purpose: otpData.purpose
    });

    // In production, send via email/SMS service
    console.log(`[OTP] ${otpData.purpose} OTP for ${otpData.identifier}: ${otp}`);

    return {
      success: true,
      message: `OTP sent to ${otpData.identifier}`,
      otpSent: true,
      otpExpiry: OTP_EXPIRES_IN,
      attemptsRemaining: MAX_OTP_ATTEMPTS
    };
  }

  // Verify OTP
  async verifyOtp(verificationData: OtpVerification): Promise<AuthResponse> {
    const storedOtp = otpStore.get(verificationData.identifier);

    if (!storedOtp) {
      throw new Error('OTP not found or expired');
    }

    if (storedOtp.expiry < new Date()) {
      otpStore.delete(verificationData.identifier);
      throw new Error('OTP has expired');
    }

    if (storedOtp.attempts >= MAX_OTP_ATTEMPTS) {
      otpStore.delete(verificationData.identifier);
      throw new Error('Too many failed attempts. Please request a new OTP.');
    }

    if (storedOtp.otp !== verificationData.otp) {
      storedOtp.attempts++;
      throw new Error(`Invalid OTP. ${MAX_OTP_ATTEMPTS - storedOtp.attempts} attempts remaining.`);
    }

    // OTP is valid
    otpStore.delete(verificationData.identifier);

    // For signup, create user if not exists
    if (storedOtp.purpose === 'signup') {
      const existingUser = this.users.find(u => u.email === verificationData.identifier);
      if (!existingUser) {
        throw new Error('User registration data not found. Please complete signup first.');
      }

      existingUser.isEmailVerified = true;
      existingUser.updatedAt = new Date().toISOString();
      this.saveUsers();
    }

    // Get user for login
    const user = this.users.find(u => 
      u.email === verificationData.identifier || u.phone === verificationData.identifier
    );

    if (!user) {
      throw new Error('User not found');
    }

    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store session
    this.sessions.set(token, {
      userId: user.id,
      token,
      expiry: new Date(Date.now() + JWT_EXPIRES_IN * 1000)
    });

    return {
      success: true,
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
      message: 'OTP verified successfully'
    };
  }

  // Refresh Token
  async refreshToken(refreshData: RefreshTokenRequest): Promise<AuthResponse> {
    const storedRefreshToken = refreshTokens.get(refreshData.refreshToken);
    
    if (!storedRefreshToken || storedRefreshToken.expiry < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = this.users.find(u => u.id === storedRefreshToken.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove old refresh token
    refreshTokens.delete(refreshData.refreshToken);

    const newToken = this.generateToken(user);
    const newRefreshToken = this.generateRefreshToken(user.id);

    // Store new session
    this.sessions.set(newToken, {
      userId: user.id,
      token: newToken,
      expiry: new Date(Date.now() + JWT_EXPIRES_IN * 1000)
    });

    return {
      success: true,
      user: this.sanitizeUser(user),
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: JWT_EXPIRES_IN
    };
  }

  // Get User Profile
  async getProfile(userId: string): Promise<UserProfile> {
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    const userBookings = this.getUserBookings(userId);
    
    return {
      user: this.sanitizeUser(user),
      stats: {
        totalBookings: userBookings.length,
        activeBookings: userBookings.filter(b => ['confirmed', 'active'].includes(b.status)).length,
        completedBookings: userBookings.filter(b => b.status === 'completed').length,
        cancelledBookings: userBookings.filter(b => b.status === 'cancelled').length,
        totalSpent: userBookings.reduce((sum, b) => sum + (b.costBreakdown?.totalCost || 0), 0),
        averageRating: 4.5 // Placeholder - would calculate from reviews
      },
      preferences: {
        emailNotifications: true,
        smsNotifications: true,
        preferredLanguage: 'en',
        currency: 'INR'
      }
    };
  }

  // Update Profile
  async updateProfile(userId: string, updateData: UpdateProfileRequest): Promise<User> {
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.dateOfBirth) user.dateOfBirth = updateData.dateOfBirth;
    if (updateData.preferences) {
      // In a real app, you'd merge preferences
      Object.assign(user.preferences || {}, updateData.preferences);
    }

    user.updatedAt = new Date().toISOString();
    this.saveUsers();

    return this.sanitizeUser(user);
  }

  // Logout
  async logout(token: string): Promise<void> {
    this.sessions.delete(token);
    
    // Remove associated refresh tokens
    for (const [refreshToken, data] of refreshTokens.entries()) {
      if (data.userId === this.sessions.get(token)?.userId) {
        refreshTokens.delete(refreshToken);
      }
    }
  }

  // Validate Token
  validateToken(token: string): User | null {
    const session = this.sessions.get(token);
    if (!session || session.expiry < new Date()) {
      return null;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = this.users.find(u => u.id === decoded.userId);
      return user ? this.sanitizeUser(user) : null;
    } catch {
      return null;
    }
  }

  // Private Helper Methods
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  private generateRefreshToken(userId: string): string {
    const refreshToken = randomUUID();
    refreshTokens.set(refreshToken, {
      userId,
      expiry: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000)
    });
    return refreshToken;
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { ...sanitized } = user;
    return sanitized;
  }

  private getUserBookings(userId: string): any[] {
    // In a real implementation, this would query the booking service
    // For now, return empty array
    return [];
  }

  private loadUsers(): void {
    try {
      if (existsSync(usersFile)) {
        const data = readFileSync(usersFile, 'utf8');
        this.users = JSON.parse(data);
      }
    } catch (error) {
      console.error('[AuthService] Failed to load users:', error);
    }
  }

  private saveUsers(): void {
    try {
      writeFileSync(usersFile, JSON.stringify(this.users, null, 2), 'utf8');
    } catch (error) {
      console.error('[AuthService] Failed to save users:', error);
    }
  }

  private loadSessions(): void {
    try {
      if (existsSync(sessionsFile)) {
        const data = readFileSync(sessionsFile, 'utf8');
        const sessions = JSON.parse(data);
        sessions.forEach((session: any) => {
          this.sessions.set(session.token, {
            ...session,
            expiry: new Date(session.expiry)
          });
        });
      }
    } catch (error) {
      console.error('[AuthService] Failed to load sessions:', error);
    }
  }

  private saveSessions(): void {
    try {
      const sessions = Array.from(this.sessions.values());
      writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2), 'utf8');
    } catch (error) {
      console.error('[AuthService] Failed to save sessions:', error);
    }
  }
}

export const authService = new AuthService();
