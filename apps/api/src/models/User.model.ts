import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  dateOfBirth: Date;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDocuments?: {
    aadhaar?: string;
    drivingLicense?: string;
    passport?: string;
  };
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    preferredLanguage: 'en' | 'hi' | 'mr';
    currency: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  depositAmount?: number;
  profilePicture?: string;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  kycDocuments: {
    aadhaar: String,
    drivingLicense: String,
    passport: String
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: true
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi', 'mr'],
      default: 'en'
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  depositAmount: Number,
  profilePicture: String
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1, phone: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ kycStatus: 1 });
userSchema.index({ isActive: 1 });

export const UserModel = mongoose.model<IUser>('User', userSchema);
