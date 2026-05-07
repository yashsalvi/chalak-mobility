import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  BookingRecord,
  BookingStatus,
  BookingStatusUpdate,
  CreateBookingRequest,
  POLICY_RULES,
} from './booking.types';

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['kyc_pending', 'cancelled'],
  kyc_pending: ['deposit_pending', 'cancelled'],
  deposit_pending: ['confirmed', 'cancelled'],
  confirmed: ['active', 'cancelled'],
  active: ['completed', 'fined', 'cancelled'],
  completed: ['closed'],
  fined: ['closed'],
  closed: [],
  cancelled: [],
};

export class BookingService {
  private readonly dataFile = path.join(__dirname, 'bookings.db.json');
  private readonly byId = new Map<string, BookingRecord>();
  private readonly byReference = new Map<string, BookingRecord>();
  private readonly byIdempotencyKey = new Map<string, BookingRecord>();

  constructor() {
    this.loadFromDisk();
  }

  getAll(sessionId?: string): BookingRecord[] {
    const records = Array.from(this.byId.values());
    if (!sessionId) {
      return records;
    }
    return records.filter((record) => record.metadata?.sessionId === sessionId);
  }

  create(payload: CreateBookingRequest): BookingRecord {
    const existing = this.byIdempotencyKey.get(payload.idempotencyKey);
    if (existing) {
      return existing;
    }

    const costBreakdown = this.calculateCost(payload);
    const now = new Date().toISOString();
    const record: BookingRecord = {
      ...payload,
      bookingId: randomUUID(),
      bookingReference: this.generateReference(),
      vehicleName: this.generateVehicleLabel(payload.vehicleSelection),
      status: 'kyc_pending',
      costBreakdown,
      depositRequired: POLICY_RULES.depositAmount,
      lateReturnFinePerDay: POLICY_RULES.lateReturnFinePerDay,
      damageFine: POLICY_RULES.damageFine,
      vehicleMisusePenalty: POLICY_RULES.vehicleMisusePenalty,
      batteryDamagePenalty: POLICY_RULES.batteryDamagePenalty,
      paymentStatus: 'pending',
      fraudFlags: {
        riskScore: this.estimateFraudRisk(payload),
        riskReasons: this.buildFraudReasons(payload),
      },
      events: [
        {
          type: 'booking.created',
          timestamp: now,
          metadata: {
            source: 'booking-api',
            vehicleType: payload.vehicleSelection.vehicleType,
            sessionId: payload.metadata?.sessionId,
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.byId.set(record.bookingId, record);
    this.byReference.set(record.bookingReference, record);
    this.byIdempotencyKey.set(payload.idempotencyKey, record);
    this.saveToDisk();
    return record;
  }

  getById(id: string): BookingRecord | null {
    return this.byId.get(id) ?? null;
  }

  getByIdentifier(identifier: string): BookingRecord | null {
    return this.byId.get(identifier) ?? this.byReference.get(identifier) ?? null;
  }

  updateStatus(identifier: string, update: BookingStatusUpdate): BookingRecord | null {
    const record = this.getByIdentifier(identifier);
    if (!record) {
      return null;
    }

    const allowed = ALLOWED_TRANSITIONS[record.status] ?? [];
    if (!allowed.includes(update.toStatus)) {
      throw new Error(
        `Invalid status transition from "${record.status}" to "${update.toStatus}".`
      );
    }

    const next: BookingRecord = {
      ...record,
      status: update.toStatus,
      updatedAt: new Date().toISOString(),
      events: [
        ...record.events,
        {
          type: 'booking.status_updated',
          timestamp: new Date().toISOString(),
          metadata: {
            from: record.status,
            to: update.toStatus,
            reason: update.reason,
          },
        },
      ],
    };

    this.byId.set(next.bookingId, next);
    this.byReference.set(next.bookingReference, next);
    this.saveToDisk();
    return next;
  }

  getStatus(identifier: string): { status: BookingStatus; nextAction: string } | null {
    const record = this.getByIdentifier(identifier);
    if (!record) {
      return null;
    }
    return {
      status: record.status,
      nextAction: this.resolveNextAction(record.status),
    };
  }

  cancel(identifier: string, reason: string): BookingRecord | null {
    const record = this.getByIdentifier(identifier);
    if (!record) {
      return null;
    }

    const allowed = ALLOWED_TRANSITIONS[record.status] ?? [];
    if (!allowed.includes('cancelled')) {
      throw new Error(
        `Cancellation is not allowed from status "${record.status}".`
      );
    }

    const next: BookingRecord = {
      ...record,
      status: 'cancelled',
      paymentStatus: record.paymentStatus === 'completed' ? 'failed' : record.paymentStatus,
      updatedAt: new Date().toISOString(),
      events: [
        ...record.events,
        {
          type: 'booking.cancelled',
          timestamp: new Date().toISOString(),
          metadata: {
            reason,
            requestedBy: 'customer',
          },
        },
      ],
    };

    this.byId.set(next.bookingId, next);
    this.byReference.set(next.bookingReference, next);
    this.saveToDisk();
    return next;
  }

  private saveToDisk(): void {
    try {
      writeFileSync(this.dataFile, JSON.stringify(this.getAll(), null, 2), 'utf8');
    } catch (error) {
      console.error('[BookingService] Failed to save booking data:', error);
    }
  }

  private loadFromDisk(): void {
    try {
      if (!existsSync(this.dataFile)) {
        return;
      }
      const fileContent = readFileSync(this.dataFile, 'utf8');
      const records = JSON.parse(fileContent) as BookingRecord[];
      records.forEach((record) => {
        this.byId.set(record.bookingId, record);
        this.byReference.set(record.bookingReference, record);
        this.byIdempotencyKey.set(record.idempotencyKey, record);
      });
    } catch (error) {
      console.error('[BookingService] Failed to load booking data:', error);
    }
  }

  private calculateCost(payload: CreateBookingRequest): BookingRecord['costBreakdown'] {
    const dailyRate = this.resolveDailyRate(payload.vehicleSelection.vehicleType);
    const rentalCost = dailyRate * payload.vehicleSelection.rentalDays;
    const insuranceCost =
      this.resolveInsuranceRate(payload.planDetails.insuranceType) *
      payload.vehicleSelection.rentalDays;
    const addOnsCost = 0;
    const subtotal = rentalCost + insuranceCost + addOnsCost;
    const taxAmount = Math.round(subtotal * 0.1 * 100) / 100;
    const discountAmount =
      payload.vehicleSelection.rentalDays >= 30
        ? Math.round(subtotal * 0.05 * 100) / 100
        : 0;
    const totalCost = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

    return {
      rentalCost,
      insuranceCost,
      addOnsCost,
      taxAmount,
      discountAmount,
      totalCost,
    };
  }

  private resolveDailyRate(vehicleType: CreateBookingRequest['vehicleSelection']['vehicleType']): number {
    const rates: Record<CreateBookingRequest['vehicleSelection']['vehicleType'], number> = {
      scooter: 110,
      delivery: 220,
      tempo: 350,
    };
    return rates[vehicleType];
  }

  private resolveInsuranceRate(insuranceType: CreateBookingRequest['planDetails']['insuranceType']): number {
    const rates: Record<CreateBookingRequest['planDetails']['insuranceType'], number> = {
      basic: 0,
      standard: 25,
      premium: 45,
    };
    return rates[insuranceType];
  }

  private generateReference(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const short = randomUUID().slice(0, 6).toUpperCase();
    return `CHL-${y}${m}${d}-${short}`;
  }

  private generateVehicleLabel(vehicleSelection: CreateBookingRequest['vehicleSelection']): string {
    const typeLabel = vehicleSelection.vehicleType
      .replace(/(^\w|_\w)/g, (match) => match.toUpperCase())
      .replace(/_/g, ' ');
    return `${typeLabel} (${vehicleSelection.vehicleId})`;
  }

  private estimateFraudRisk(payload: CreateBookingRequest): number {
    const scoreBase = 10;
    const lineItemRisk = payload.planDetails.addons.length * 2;
    const metadataRisk = payload.metadata?.userAgent?.toLowerCase().includes('curl') ? 30 : 0;
    return Math.min(100, scoreBase + lineItemRisk + metadataRisk);
  }

  private buildFraudReasons(payload: CreateBookingRequest): string[] {
    const reasons: string[] = [];
    if (payload.planDetails.addons.length > 2) {
      reasons.push('Multiple premium add-ons selected.');
    }
    if (payload.metadata?.userAgent?.toLowerCase().includes('curl')) {
      reasons.push('Non-browser client detected.');
    }
    if (payload.kyc.drivingLicenseUploadStatus !== 'verified') {
      reasons.push('Driving license requires manual verification.');
    }
    return reasons;
  }

  private resolveNextAction(status: BookingStatus): string {
    switch (status) {
      case 'kyc_pending':
        return 'complete_kyc';
      case 'deposit_pending':
        return 'pay_deposit';
      case 'confirmed':
        return 'await_start';
      case 'active':
        return 'in_rental';
      case 'completed':
        return 'review';
      default:
        return 'review_status';
    }
  }
}

export const bookingService = new BookingService();
