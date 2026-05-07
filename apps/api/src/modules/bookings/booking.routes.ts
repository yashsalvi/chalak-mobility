import { Router } from 'express';
import { bookingService } from './booking.service';
import { validateRequest } from '../../server/validation';
import {
  bookingIdParamsSchema,
  bookingCancelSchema,
  bookingStatusUpdateSchema,
  createBookingSchema,
} from './booking.schemas';
import type { BookingRecord } from './booking.types';

export const bookingsRouter = Router();

function buildBookingDetailsResponse(booking: BookingRecord) {
  const subtotal =
    booking.costBreakdown.rentalCost +
    booking.costBreakdown.insuranceCost +
    booking.costBreakdown.addOnsCost;

  return {
    bookingId: booking.bookingId,
    bookingReference: booking.bookingReference,
    status: booking.status,
    createdAt: booking.createdAt,
    submittedAt: booking.createdAt,
    vehicleId: booking.vehicleSelection.vehicleId,
    vehicleName: booking.vehicleName,
    startDate: booking.vehicleSelection.startDate,
    endDate: booking.vehicleSelection.endDate,
    rentalDays: booking.vehicleSelection.rentalDays,
    insuranceType: booking.planDetails.insuranceType,
    rideType: booking.planDetails.rideType,
    addons: booking.planDetails.addons,
    contactInfo: {
      firstName: booking.bookingDetails.contactInfo.firstName,
      lastName: booking.bookingDetails.contactInfo.lastName,
      email: booking.bookingDetails.contactInfo.email,
      phone: booking.bookingDetails.contactInfo.phone,
    },
    pickupLocation: booking.bookingDetails.pickupLocation,
    dropoffLocation: booking.bookingDetails.dropoffLocation,
    costBreakdown: {
      ...booking.costBreakdown,
      subtotal,
    },
    deposit: booking.depositRequired,
    lateReturnFinePerDay: booking.lateReturnFinePerDay,
    damageFine: booking.damageFine,
    misusePenalty: booking.vehicleMisusePenalty,
    batteryDamagePenalty: booking.batteryDamagePenalty,
    kycStatus: booking.kyc.drivingLicenseUploadStatus,
    kycRejectionReason:
      booking.kyc.drivingLicenseUploadStatus === 'rejected'
        ? 'Driving license verification failed.'
        : undefined,
    agreementAcceptedAt: booking.agreements.acceptedAt,
    agreementVersion: booking.agreements.agreementVersion,
    penaltyPolicyAccepted: booking.agreements.agreeToPenaltyPolicy,
    fraudFlags: booking.fraudFlags,
    nextAction: bookingService.getStatus(booking.bookingId)?.nextAction,
    actionRequiredBy: undefined,
    paymentStatus: booking.paymentStatus,
    events: booking.events,
  };
}

bookingsRouter.post('/', validateRequest('body', createBookingSchema), (req, res) => {
  const booking = bookingService.create(req.body);
  res.status(201).json({
    success: true,
    bookingId: booking.bookingId,
    bookingReference: booking.bookingReference,
    status: booking.status,
    depositRequired: booking.depositRequired,
    nextAction: bookingService.getStatus(booking.bookingId)?.nextAction,
    createdAt: booking.createdAt,
  });
});

bookingsRouter.get('/', (req, res) => {
  const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined;
  const bookings = bookingService.getAll(sessionId).map(buildBookingDetailsResponse);

  res.json({
    success: true,
    data: bookings,
  });
});

bookingsRouter.get('/:id', validateRequest('params', bookingIdParamsSchema), (req, res) => {
  const booking = bookingService.getByIdentifier(req.params.id);
  if (!booking) {
    res.status(404).json({
      success: false,
      message: 'Booking not found.',
    });
    return;
  }

  res.json(buildBookingDetailsResponse(booking));
});

bookingsRouter.get('/:id/status', validateRequest('params', bookingIdParamsSchema), (req, res) => {
  const statusPayload = bookingService.getStatus(req.params.id);
  if (!statusPayload) {
    res.status(404).json({
      success: false,
      message: 'Booking not found.',
    });
    return;
  }

  res.json({
    success: true,
    bookingId: req.params.id,
    status: statusPayload.status,
    nextAction: statusPayload.nextAction,
  });
});

bookingsRouter.post(
  '/:id/cancel',
  validateRequest('params', bookingIdParamsSchema),
  validateRequest('body', bookingCancelSchema),
  (req, res) => {
    try {
      const booking = bookingService.cancel(req.params.id, req.body.reason);
      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Booking not found.',
        });
        return;
      }

      res.json({
        success: true,
        bookingId: booking.bookingId,
        bookingReference: booking.bookingReference,
        status: booking.status,
        updatedAt: booking.updatedAt,
      });
    } catch (error) {
      res.status(409).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel booking.',
      });
    }
  }
);

bookingsRouter.patch(
  '/:id/status',
  validateRequest('params', bookingIdParamsSchema),
  validateRequest('body', bookingStatusUpdateSchema),
  (req, res) => {
    try {
      const booking = bookingService.updateStatus(req.params.id, req.body);
      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Booking not found.',
        });
        return;
      }

      res.json({
        success: true,
        bookingId: booking.bookingId,
        bookingReference: booking.bookingReference,
        currentStatus: booking.status,
        updatedAt: booking.updatedAt,
      });
    } catch (error) {
      res.status(409).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update booking status.',
      });
    }
  }
);
