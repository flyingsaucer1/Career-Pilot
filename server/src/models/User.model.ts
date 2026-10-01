import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark';
  };
  sessionVersion: number;
  writeFence: number;
  lastPasswordResetAt?: Date;
  aiConsentVersion?: string;
  aiConsentAt?: Date;
  termsAcceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      validate: { validator: (value: string) => Buffer.byteLength(value, 'utf8') <= 72, message: 'Password must be at most 72 UTF-8 bytes' },
      select: false, // never returned in queries by default
    },
    avatar: {
      type: String,
      default: null,
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    },
    // Embedded in access and refresh tokens so password/security changes can
    // invalidate every previously issued token without storing raw tokens.
    sessionVersion: { type: Number, default: 0, select: false },
    writeFence: { type: Number, default: 0, select: false },
    lastPasswordResetAt: { type: Date, select: false },
    aiConsentVersion: { type: String },
    aiConsentAt: { type: Date },
    termsAcceptedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        if (ret.password) {
          delete (ret as any).password;
        }
        delete (ret as any).sessionVersion;
        delete (ret as any).writeFence;
        delete (ret as any).lastPasswordResetAt;
        return ret;
      },
    },
  }
);

// Hash password before save
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare plain password to hash
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method: find by email (includes password field for auth)
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email }).select('+password');
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
