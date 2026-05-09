import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  _id: mongoose.Types.ObjectId;
  identifier: string;
  otp: string;
  purpose: 'login' | 'signup' | 'reset_password';
  attempts: number;
  expiry: Date;
  isUsed: boolean;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>({
  identifier: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  purpose: {
    type: String,
    enum: ['login', 'signup', 'reset_password'],
    required: true
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  expiry: {
    type: Date,
    required: true,
    index: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
otpSchema.index({ identifier: 1, purpose: 1, isUsed: 1 });
otpSchema.index({ expiry: 1 });

// TTL index to automatically expire OTPs
otpSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

export const OtpModel = mongoose.model<IOtp>('Otp', otpSchema);
