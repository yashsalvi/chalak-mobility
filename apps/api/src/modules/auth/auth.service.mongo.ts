import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { DatabaseConnection } from '../../database/connection';
import { UserModel, IUser } from '../../models/User.model';
import { SessionModel, ISession } from '../../models/Session.model';
import { OtpModel, IOtp } from '../../models/Otp.model';
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

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = 60 * 60 * 24; // 24 hours
const REFRESH_TOKEN_EXPIRES_IN = 60 * 60 * 24 * 30; // 30 days
const OTP_EXPIRES_IN = 10 * 60; // 10 minutes
const MAX_OTP_ATTEMPTS = 3;
const SALT_ROUNDS = 12;

export class MongoAuthService {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  // User Registration
  async register(userData: CreateUserRequest): Promise<AuthResponse> {
    await this.db.connect();

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email: userData.email }, { phone: userData.phone }]
    });

    if (existingUser) {
      throw new Error('User with this email or phone already exists');
    }

    // Validate terms agreement
    if (!userData.agreeToTerms || !userData.agreeToPrivacy) {
      throw new Error('You must agree to terms and privacy policy');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Create user
    const user = new UserModel({
      email: userData.email,
      phone: userData.phone,
      firstName: userData.firstName,
      lastName: userData.lastName,
      dateOfBirth: new Date(userData.dateOfBirth),
      password: hashedPassword,
      preferences: {
        emailNotifications: true,
        smsNotifications: true,
        preferredLanguage: 'en' as const,
        currency: 'INR'
      }
    });

    await user.save();

    // Generate OTP for email verification
    const otp = this.generateOtp();
    await OtpModel.create({
      identifier: userData.email,
      otp,
      purpose: 'signup',
      expiry: new Date(Date.now() + OTP_EXPIRES_IN * 1000),
      attempts: 0
    });

    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Create session
    await SessionModel.create({
      userId: user._id,
      token,
      refreshToken,
      expiry: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000)
    });

    return {
      success: true,
      user: this.mapUserToResponse(user),
      token,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN
    };
  }

  // User Login
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    await this.db.connect();

    // Find user by email or phone
    const user = await UserModel.findOne({
      $or: [{ email: loginData.identifier }, { phone: loginData.identifier }]
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Create session
    await SessionModel.create({
      userId: user._id,
      token,
      refreshToken,
      expiry: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000)
    });

    return {
      success: true,
      user: this.mapUserToResponse(user),
      token,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN
    };
  }

  // Request OTP
  async requestOtp(otpData: OtpRequest): Promise<OtpResponse> {
    await this.db.connect();

    // Find user
    const user = await UserModel.findOne({
      $or: [{ email: otpData.identifier }, { phone: otpData.identifier }]
    });

    if (!user && otpData.purpose === 'login') {
      throw new Error('User not found');
    }

    // Generate OTP
    const otp = this.generateOtp();
    const expiry = new Date(Date.now() + OTP_EXPIRES_IN * 1000);

    // Remove any existing OTP for this identifier
    await OtpModel.deleteMany({
      identifier: otpData.identifier,
      purpose: otpData.purpose
    });

    // Create new OTP
    await OtpModel.create({
      identifier: otpData.identifier,
      otp,
      purpose: otpData.purpose,
      expiry,
      attempts: 0
    });

    return {
      success: true,
      message: 'OTP sent successfully',
      otpSent: true,
      otpExpiry: Math.floor((expiry.getTime() - Date.now()) / 1000)
    };
  }

  // Verify OTP
  async verifyOtp(otpData: OtpVerification): Promise<AuthResponse> {
    await this.db.connect();

    // Find OTP
    const otpRecord = await OtpModel.findOne({
      identifier: otpData.identifier,
      otp: otpData.otp,
      purpose: otpData.purpose,
      isUsed: false,
      expiry: { $gt: new Date() }
    });

    if (!otpRecord) {
      throw new Error('Invalid or expired OTP');
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      throw new Error('Too many attempts. Please request a new OTP');
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Find or create user based on purpose
    let user;
    if (otpData.purpose === 'signup') {
      // This is a new user signup flow
      user = await UserModel.findOne({
        $or: [{ email: otpData.identifier }, { phone: otpData.identifier }]
      });

      if (!user) {
        throw new Error('User not found. Please complete registration first.');
      }
    } else {
      user = await UserModel.findOne({
        $or: [{ email: otpData.identifier }, { phone: otpData.identifier }]
      });

      if (!user) {
        throw new Error('User not found');
      }
    }

    // Update verification status
    if (otpData.identifier.includes('@')) {
      user.isEmailVerified = true;
    } else {
      user.isPhoneVerified = true;
    }
    await user.save();

    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Create session
    await SessionModel.create({
      userId: user._id,
      token,
      refreshToken,
      expiry: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000)
    });

    return {
      success: true,
      user: this.mapUserToResponse(user),
      token,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN
    };
  }

  // Refresh Token
  async refreshToken(refreshData: RefreshTokenRequest): Promise<AuthResponse> {
    await this.db.connect();

    // Find session
    const session = await SessionModel.findOne({
      refreshToken: refreshData.refreshToken,
      isActive: true,
      expiry: { $gt: new Date() }
    }).populate('userId');

    if (!session) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await UserModel.findById(session.userId);
    const token = this.generateToken(user);

    // Update session
    session.token = token;
    session.lastAccessedAt = new Date();
    await session.save();

    return {
      success: true,
      user: this.mapUserToResponse(user),
      token,
      refreshToken: refreshData.refreshToken,
      expiresIn: JWT_EXPIRES_IN
    };
  }

  // Get User Profile
  async getProfile(userId: string): Promise<UserProfile> {
    await this.db.connect();

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.mapUserToProfile(user);
  }

  // Update Profile
  async updateProfile(userId: string, updateData: UpdateProfileRequest): Promise<UserProfile> {
    await this.db.connect();

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update allowed fields
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.dateOfBirth) user.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.preferences) {
      user.preferences = { 
        ...user.preferences, 
        ...updateData.preferences,
        preferredLanguage: (updateData.preferences.preferredLanguage || user.preferences.preferredLanguage) as 'en' | 'hi' | 'mr'
      };
    }

    await user.save();
    return this.mapUserToProfile(user);
  }

  // Logout
  async logout(token: string): Promise<void> {
    await this.db.connect();

    await SessionModel.updateOne(
      { token },
      { isActive: false }
    );
  }

  // Helper Methods
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateToken(user: IUser): string {
    return jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        phone: user.phone
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  private generateRefreshToken(user: IUser): string {
    return jwt.sign(
      { 
        userId: user._id.toString(),
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
  }

  private mapUserToResponse(user: IUser): User {
    return {
      id: user._id.toString(),
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth.toISOString().split('T')[0],
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isKycCompleted: user.kycStatus === 'verified',
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private mapUserToProfile(user: IUser): UserProfile {
    return {
      user: this.mapUserToResponse(user),
      stats: {
        totalBookings: 0,
        activeBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalSpent: 0,
        averageRating: 0
      },
      preferences: user.preferences
    };
  }
}

export const mongoAuthService = new MongoAuthService();
