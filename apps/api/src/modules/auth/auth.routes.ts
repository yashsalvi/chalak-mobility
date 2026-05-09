import { Router } from 'express';
import { authService } from './auth.service';
import { validateRequest } from '../../server/validation';
import { z } from 'zod';
import type { Request, Response } from 'express';

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^[\d\s\-\+\(\)]{10,20}$/, 'Invalid phone format'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be less than 50 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to terms of service'),
  agreeToPrivacy: z.boolean().refine(val => val === true, 'You must agree to privacy policy'),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const otpRequestSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  purpose: z.enum(['login', 'signup', 'reset_password']),
});

const otpVerificationSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  purpose: z.enum(['login', 'signup', 'reset_password']),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be less than 50 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be less than 50 characters').optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  preferences: z.object({
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    preferredLanguage: z.string().optional(),
    currency: z.string().optional(),
  }).optional(),
});

export const authRouter = Router();

// Middleware to extract user from token
const authenticateToken = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token is required',
    });
    return;
  }

  try {
    const user = authService.validateToken(token);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token validation failed',
    });
  }
};

// POST /api/auth/register - User registration
authRouter.post('/register', validateRequest('body', createUserSchema), async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed',
    });
  }
});

// POST /api/auth/login - User login
authRouter.post('/login', validateRequest('body', loginSchema), async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Login failed',
    });
  }
});

// POST /api/auth/send-otp - Send OTP
authRouter.post('/send-otp', validateRequest('body', otpRequestSchema), async (req, res) => {
  try {
    const result = await authService.sendOtp(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send OTP',
    });
  }
});

// POST /api/auth/verify-otp - Verify OTP
authRouter.post('/verify-otp', validateRequest('body', otpVerificationSchema), async (req, res) => {
  try {
    const result = await authService.verifyOtp(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'OTP verification failed',
    });
  }
});

// POST /api/auth/refresh-token - Refresh access token
authRouter.post('/refresh-token', validateRequest('body', refreshTokenSchema), async (req, res) => {
  try {
    const result = await authService.refreshToken(req.body);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Token refresh failed',
    });
  }
});

// GET /api/auth/profile - Get user profile (protected)
authRouter.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const profile = await authService.getProfile(user.id);
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Profile not found',
    });
  }
});

// PUT /api/auth/profile - Update user profile (protected)
authRouter.put('/profile', authenticateToken, validateRequest('body', updateProfileSchema), async (req, res) => {
  try {
    const user = (req as any).user;
    const updatedUser = await authService.updateProfile(user.id, req.body);
    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Profile update failed',
    });
  }
});

// POST /api/auth/logout - Logout (protected)
authRouter.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      await authService.logout(token);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
});

// GET /api/auth/me - Get current user info (protected)
authRouter.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user info',
    });
  }
});
