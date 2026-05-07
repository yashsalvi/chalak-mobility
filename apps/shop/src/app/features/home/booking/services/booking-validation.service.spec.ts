/**
 * Booking Validation Service Tests
 * Comprehensive test coverage for all validation scenarios
 */

import { TestBed } from '@angular/core/testing';
import { BookingValidationService } from './booking-validation.service';
import {
  BookingForm,
  VehicleSelection,
  PlanDetails,
  BookingDetails,
  PaymentInfo,
  BOOKING_CONFIG,
  Vehicle,
} from '../models/booking.model';

describe('BookingValidationService', () => {
  let service: BookingValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookingValidationService],
    });
    service = TestBed.inject(BookingValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateVehicleSelection', () => {
    it('should fail when no vehicle is selected', () => {
      const selection: VehicleSelection = {
        vehicleId: null,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        rentalDays: 1,
        estimatedCost: 100,
      };

      const result = service.validateVehicleSelection(selection);

      expect(result.isValid).toBeFalse();
      expect(result.errors['vehicleId']).toBeTruthy();
    });

    it('should fail when start date is in the past', () => {
      const pastDate = new Date(Date.now() - 86400000);
      const selection: VehicleSelection = {
        vehicleId: 'vehicle-1',
        startDate: pastDate,
        endDate: new Date(),
        rentalDays: 1,
        estimatedCost: 100,
      };

      const result = service.validateVehicleSelection(selection);

      expect(result.isValid).toBeFalse();
      expect(result.errors['startDate']).toContain('cannot be in the past');
    });

    it('should fail when start date is less than minimum advance hours', () => {
      const oneHourFromNow = new Date(Date.now() + 3600000);
      const selection: VehicleSelection = {
        vehicleId: 'vehicle-1',
        startDate: oneHourFromNow,
        endDate: new Date(oneHourFromNow.getTime() + 86400000),
        rentalDays: 1,
        estimatedCost: 100,
      };

      const result = service.validateVehicleSelection(selection);

      expect(result.isValid).toBeFalse();
      expect(result.errors['startDate']).toContain('at least');
    });

    it('should fail when end date is before start date', () => {
      const startDate = new Date(Date.now() + 172800000); // 2 days from now
      const endDate = new Date(startDate.getTime() - 86400000); // 1 day before start
      const selection: VehicleSelection = {
        vehicleId: 'vehicle-1',
        startDate,
        endDate,
        rentalDays: -1,
        estimatedCost: 100,
      };

      const result = service.validateVehicleSelection(selection);

      expect(result.isValid).toBeFalse();
      expect(result.errors['endDate']).toContain('after start date');
    });

    it('should fail when rental days exceed maximum', () => {
      const startDate = new Date(Date.now() + 172800000);
      const selection: VehicleSelection = {
        vehicleId: 'vehicle-1',
        startDate,
        endDate: new Date(startDate.getTime() + BOOKING_CONFIG.MAX_RENTAL_DAYS * 86400000 + 86400000),
        rentalDays: BOOKING_CONFIG.MAX_RENTAL_DAYS + 1,
        estimatedCost: 100,
      };

      const result = service.validateVehicleSelection(selection);

      expect(result.isValid).toBeFalse();
      expect(result.errors['rentalDays']).toContain('Maximum');
    });

    it('should fail when vehicle is unavailable', () => {
      const vehicle: Vehicle = {
        id: 'vehicle-1',
        name: 'Test Scooter',
        type: 'scooter',
        pricePerDay: 50,
        available: false,
      };

      const startDate = new Date(Date.now() + 172800000);
      const selection: VehicleSelection = {
        vehicleId: 'vehicle-1',
        selectedVehicle: vehicle,
        startDate,
        endDate: new Date(startDate.getTime() + 86400000),
        rentalDays: 1,
        estimatedCost: 50,
      };

      const result = service.validateVehicleSelection(selection);

      expect(result.isValid).toBeFalse();
      expect(result.errors['vehicleId']).toContain('not available');
    });

    it('should pass when all fields are valid', () => {
      const vehicle: Vehicle = {
        id: 'vehicle-1',
        name: 'Test Scooter',
        type: 'scooter',
        pricePerDay: 50,
        available: true,
      };

      const startDate = new Date(Date.now() + 172800000);
      const selection: VehicleSelection = {
        vehicleId: 'vehicle-1',
        selectedVehicle: vehicle,
        startDate,
        endDate: new Date(startDate.getTime() + 86400000),
        rentalDays: 1,
        estimatedCost: 50,
      };

      const result = service.validateVehicleSelection(selection);

      expect(result.isValid).toBeTrue();
      expect(Object.keys(result.errors).length).toBe(0);
    });
  });

  describe('validatePaymentInfo', () => {
    it('should fail when no payment method is selected', () => {
      const paymentInfo: PaymentInfo = {
        method: null,
        saveCard: false,
        agreeToAutomaticPayment: false,
      };

      const result = service.validatePaymentInfo(paymentInfo);

      expect(result.isValid).toBeFalse();
      expect(result.errors['method']).toBeTruthy();
    });

    it('should fail when card number is invalid', () => {
      const paymentInfo: PaymentInfo = {
        method: 'credit-card',
        cardNumber: '1234',
        cardHolder: 'John Doe',
        expiryDate: '12/25',
        cvv: '123',
        agreeToAutomaticPayment: true,
      };

      const result = service.validatePaymentInfo(paymentInfo);

      expect(result.isValid).toBeFalse();
      expect(result.errors['cardNumber']).toBeTruthy();
    });

    it('should fail when expiry date is in the past', () => {
      const paymentInfo: PaymentInfo = {
        method: 'credit-card',
        cardNumber: '4532015112830366', // Valid test card number
        cardHolder: 'John Doe',
        expiryDate: '01/20', // Past date
        cvv: '123',
        agreeToAutomaticPayment: true,
      };

      const result = service.validatePaymentInfo(paymentInfo);

      expect(result.isValid).toBeFalse();
      expect(result.errors['expiryDate']).toContain('expired');
    });

    it('should fail when automatic payment not agreed', () => {
      const paymentInfo: PaymentInfo = {
        method: 'credit-card',
        cardNumber: '4532015112830366',
        cardHolder: 'John Doe',
        expiryDate: '12/25',
        cvv: '123',
        agreeToAutomaticPayment: false,
      };

      const result = service.validatePaymentInfo(paymentInfo);

      expect(result.isValid).toBeFalse();
      expect(result.errors['agreeToAutomaticPayment']).toBeTruthy();
    });

    it('should validate card using Luhn algorithm', () => {
      // Invalid Luhn number
      const paymentInfo: PaymentInfo = {
        method: 'credit-card',
        cardNumber: '4532015112830367', // Invalid (should end in 366)
        cardHolder: 'John Doe',
        expiryDate: '12/25',
        cvv: '123',
        agreeToAutomaticPayment: true,
      };

      const result = service.validatePaymentInfo(paymentInfo);

      expect(result.isValid).toBeFalse();
      expect(result.errors['cardNumber']).toContain('validation check');
    });

    it('should pass with valid payment info', () => {
      const paymentInfo: PaymentInfo = {
        method: 'credit-card',
        cardNumber: '4532015112830366', // Valid test card
        cardHolder: 'John Doe',
        expiryDate: '12/25',
        cvv: '123',
        agreeToAutomaticPayment: true,
      };

      const result = service.validatePaymentInfo(paymentInfo);

      expect(result.isValid).toBeTrue();
    });
  });

  describe('validateBookingDetails', () => {
    it('should fail when first name is empty', () => {
      const details: BookingDetails = {
        contactInfo: {
          firstName: '',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          phoneCountryCode: '+1',
          dateOfBirth: new Date('1990-01-01'),
          licenseNumber: 'DL123456',
          licenseCountry: 'US',
          licenseExpiryDate: new Date(Date.now() + 86400000 * 365),
        },
        pickupLocation: { locationType: 'city-center' },
        dropoffLocation: { locationType: 'city-center' },
        agreeToTerms: true,
      };

      const result = service.validateBookingDetails(details);

      expect(result.isValid).toBeFalse();
      expect(result.errors['firstName']).toBeTruthy();
    });

    it('should fail when email is invalid', () => {
      const details: BookingDetails = {
        contactInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          phone: '+1234567890',
          phoneCountryCode: '+1',
          dateOfBirth: new Date('1990-01-01'),
          licenseNumber: 'DL123456',
          licenseCountry: 'US',
          licenseExpiryDate: new Date(Date.now() + 86400000 * 365),
        },
        pickupLocation: { locationType: 'city-center' },
        dropoffLocation: { locationType: 'city-center' },
        agreeToTerms: true,
      };

      const result = service.validateBookingDetails(details);

      expect(result.isValid).toBeFalse();
      expect(result.errors['email']).toContain('valid email');
    });

    it('should fail when user is underage', () => {
      const today = new Date();
      const underageDate = new Date(
        today.getFullYear() - (BOOKING_CONFIG.MIN_AGE - 1),
        today.getMonth(),
        today.getDate()
      );

      const details: BookingDetails = {
        contactInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          phoneCountryCode: '+1',
          dateOfBirth: underageDate,
          licenseNumber: 'DL123456',
          licenseCountry: 'US',
          licenseExpiryDate: new Date(Date.now() + 86400000 * 365),
        },
        pickupLocation: { locationType: 'city-center' },
        dropoffLocation: { locationType: 'city-center' },
        agreeToTerms: true,
      };

      const result = service.validateBookingDetails(details);

      expect(result.isValid).toBeFalse();
      expect(result.errors['dateOfBirth']).toContain('at least');
    });

    it('should fail when license has expired', () => {
      const details: BookingDetails = {
        contactInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          phoneCountryCode: '+1',
          dateOfBirth: new Date('1990-01-01'),
          licenseNumber: 'DL123456',
          licenseCountry: 'US',
          licenseExpiryDate: new Date(Date.now() - 86400000),
        },
        pickupLocation: { locationType: 'city-center' },
        dropoffLocation: { locationType: 'city-center' },
        agreeToTerms: true,
      };

      const result = service.validateBookingDetails(details);

      expect(result.isValid).toBeFalse();
      expect(result.errors['licenseExpiryDate']).toContain('expired');
    });

    it('should fail when terms are not agreed', () => {
      const details: BookingDetails = {
        contactInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          phoneCountryCode: '+1',
          dateOfBirth: new Date('1990-01-01'),
          licenseNumber: 'DL123456',
          licenseCountry: 'US',
          licenseExpiryDate: new Date(Date.now() + 86400000 * 365),
        },
        pickupLocation: { locationType: 'city-center' },
        dropoffLocation: { locationType: 'city-center' },
        agreeToTerms: false,
      };

      const result = service.validateBookingDetails(details);

      expect(result.isValid).toBeFalse();
      expect(result.errors['agreeToTerms']).toBeTruthy();
    });

    it('should pass with valid booking details', () => {
      const details: BookingDetails = {
        contactInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          phoneCountryCode: '+1',
          dateOfBirth: new Date('1990-01-01'),
          licenseNumber: 'DL123456',
          licenseCountry: 'US',
          licenseExpiryDate: new Date(Date.now() + 86400000 * 365),
        },
        pickupLocation: { locationType: 'city-center' },
        dropoffLocation: { locationType: 'city-center' },
        agreeToTerms: true,
      };

      const result = service.validateBookingDetails(details);

      expect(result.isValid).toBeTrue();
    });
  });

  describe('Luhn Algorithm', () => {
    it('should validate correct card numbers', () => {
      // These are test card numbers that pass Luhn validation
      const validCards = [
        '4532015112830366', // Visa
        '5425233010103442', // Mastercard
        '378282246310005',  // American Express
      ];

      validCards.forEach((card) => {
        const paymentInfo: PaymentInfo = {
          method: 'credit-card',
          cardNumber: card,
          cardHolder: 'Test User',
          expiryDate: '12/25',
          cvv: '123',
          agreeToAutomaticPayment: true,
        };

        const result = service.validatePaymentInfo(paymentInfo);
        expect(result.isValid).toBeTrue(`Card ${card} should be valid`);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values gracefully', () => {
      const selection: VehicleSelection = {
        vehicleId: null,
        startDate: null,
        endDate: null,
        rentalDays: 0,
        estimatedCost: 0,
      };

      expect(() => {
        service.validateVehicleSelection(selection);
      }).not.toThrow();
    });

    it('should handle very long strings', () => {
      const details: BookingDetails = {
        contactInfo: {
          firstName: 'a'.repeat(100),
          lastName: 'b'.repeat(100),
          email: 'john@example.com',
          phone: '+1234567890',
          phoneCountryCode: '+1',
          dateOfBirth: new Date('1990-01-01'),
          licenseNumber: 'DL123456',
          licenseCountry: 'US',
          licenseExpiryDate: new Date(Date.now() + 86400000 * 365),
        },
        pickupLocation: { locationType: 'city-center' },
        dropoffLocation: { locationType: 'city-center' },
        agreeToTerms: true,
      };

      const result = service.validateBookingDetails(details);

      // Should fail due to invalid format
      expect(result.isValid).toBeFalse();
    });
  });
});
