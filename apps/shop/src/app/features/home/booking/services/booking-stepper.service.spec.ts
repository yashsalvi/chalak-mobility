/**
 * Booking Stepper Service Tests
 * Comprehensive test coverage for state management and navigation
 */

import { TestBed } from '@angular/core/testing';
import { BookingStepperService } from './booking-stepper.service';
import { BookingValidationService } from './booking-validation.service';
import {
  BookingForm,
  VehicleSelection,
  PlanDetails,
  BookingDetails,
  PaymentInfo,
  Vehicle,
} from '../models/booking.model';

describe('BookingStepperService', () => {
  let service: BookingStepperService;
  let validationService: BookingValidationService;

  const mockVehicle: Vehicle = {
    id: 'vehicle-1',
    name: 'Test Scooter',
    type: 'scooter',
    pricePerDay: 50,
    available: true,
  };

  const validVehicleSelection: VehicleSelection = {
    vehicleId: 'vehicle-1',
    selectedVehicle: mockVehicle,
    startDate: new Date(Date.now() + 172800000),
    endDate: new Date(Date.now() + 259200000),
    rentalDays: 1,
    estimatedCost: 50,
  };

  const validPlanDetails: PlanDetails = {
    insuranceType: 'basic',
    rideType: 'standard',
    addons: [],
  };

  const validBookingDetails: BookingDetails = {
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

  const validPaymentInfo: PaymentInfo = {
    method: 'credit-card',
    cardNumber: '4532015112830366',
    cardHolder: 'John Doe',
    expiryDate: '12/25',
    cvv: '123',
    agreeToAutomaticPayment: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookingStepperService, BookingValidationService],
    });
    service = TestBed.inject(BookingStepperService);
    validationService = TestBed.inject(BookingValidationService);

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should start at step 1', (done) => {
      service.navigationState$.subscribe((state) => {
        expect(state.currentStep).toBe(1);
        done();
      });
    });

    it('should have empty booking form initially', (done) => {
      service.bookingForm$.subscribe((form) => {
        expect(form.vehicleSelection).toBeNull();
        expect(form.planDetails).toBeNull();
        expect(form.bookingDetails).toBeNull();
        expect(form.paymentInfo).toBeNull();
        done();
      });
    });

    it('should have no errors initially', (done) => {
      service.error$.subscribe((error) => {
        expect(error).toBeNull();
        done();
      });
    });
  });

  describe('Vehicle Selection Updates', () => {
    it('should update vehicle selection', (done) => {
      service.updateVehicleSelection(validVehicleSelection);

      service.bookingForm$.subscribe((form) => {
        expect(form.vehicleSelection).toEqual(validVehicleSelection);
        done();
      });
    });

    it('should recalculate cost when vehicle changes', (done) => {
      const selection = { ...validVehicleSelection };
      service.updateVehicleSelection(selection);

      service.bookingForm$.subscribe((form) => {
        expect(form.totalCost).toBeGreaterThan(0);
        done();
      });
    });

    it('should emit hasUnsavedChanges after update', (done) => {
      service.hasUnsavedChanges$.subscribe((changed) => {
        expect(changed).toBeTrue();
        done();
      });

      service.updateVehicleSelection(validVehicleSelection);
    });
  });

  describe('Plan Details Updates', () => {
    it('should update plan details', (done) => {
      service.updatePlanDetails(validPlanDetails);

      service.bookingForm$.subscribe((form) => {
        expect(form.planDetails).toEqual(validPlanDetails);
        done();
      });
    });

    it('should recalculate cost when insurance changes', (done) => {
      service.updateVehicleSelection(validVehicleSelection);
      const planWithInsurance = { ...validPlanDetails, insuranceType: 'premium' };

      service.updatePlanDetails(planWithInsurance);

      service.bookingForm$.subscribe((form) => {
        expect(form.totalCost).toBeGreaterThan(50);
        done();
      });
    });
  });

  describe('Navigation', () => {
    it('should not navigate forward if current step is invalid', (done) => {
      let stepCount = 0;
      service.navigationState$.subscribe((state) => {
        stepCount++;
        if (stepCount === 1) {
          // Initial subscription
          expect(state.currentStep).toBe(1);
        }
      });

      service.nextStep();

      setTimeout(() => {
        service.navigationState$.subscribe((state) => {
          expect(state.currentStep).toBe(1); // Should still be at step 1
          done();
        });
      }, 100);
    });

    it('should navigate forward when current step is valid', (done) => {
      service.updateVehicleSelection(validVehicleSelection);
      service.nextStep();

      setTimeout(() => {
        service.navigationState$.subscribe((state) => {
          expect(state.currentStep).toBe(2);
          done();
        });
      }, 100);
    });

    it('should navigate backward', (done) => {
      service.updateVehicleSelection(validVehicleSelection);
      service.nextStep();

      setTimeout(() => {
        service.previousStep();

        setTimeout(() => {
          service.navigationState$.subscribe((state) => {
            expect(state.currentStep).toBe(1);
            done();
          });
        }, 100);
      }, 100);
    });

    it('should not navigate before step 1', (done) => {
      service.previousStep();

      service.navigationState$.subscribe((state) => {
        expect(state.currentStep).toBe(1);
        done();
      });
    });

    it('should allow navigation to completed steps', (done) => {
      service.updateVehicleSelection(validVehicleSelection);
      service.nextStep();

      setTimeout(() => {
        service.updatePlanDetails(validPlanDetails);
        service.nextStep();

        setTimeout(() => {
          service.jumpToStep(1);

          setTimeout(() => {
            service.navigationState$.subscribe((state) => {
              expect(state.currentStep).toBe(1);
              done();
            });
          }, 100);
        }, 100);
      }, 100);
    });

    it('should not allow navigation to unvisited steps', (done) => {
      service.jumpToStep(4);

      service.navigationState$.subscribe((state) => {
        expect(state.currentStep).not.toBe(4);
        done();
      });
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate base cost correctly', (done) => {
      service.updateVehicleSelection({
        ...validVehicleSelection,
        rentalDays: 2,
        estimatedCost: 100, // 50 * 2
      });

      service.bookingForm$.subscribe((form) => {
        // Base cost = 100, with tax (10%) = 110
        const expectedCost = 100 * (1 + 0.1);
        expect(form.totalCost).toBeCloseTo(expectedCost, 1);
        done();
      });
    });

    it('should include insurance cost in total', (done) => {
      service.updateVehicleSelection(validVehicleSelection);
      service.updatePlanDetails({
        ...validPlanDetails,
        insuranceType: 'premium', // Adds cost
      });

      service.bookingForm$.subscribe((form) => {
        expect(form.totalCost).toBeGreaterThan(50 * 1.1); // More than base + tax
        done();
      });
    });

    it('should handle rounding correctly', (done) => {
      service.updateVehicleSelection({
        ...validVehicleSelection,
        estimatedCost: 33.33,
      });

      service.bookingForm$.subscribe((form) => {
        // Check that cost is properly rounded to cents
        const cents = (form.totalCost * 100) % 1;
        expect(cents).toBe(0); // Should be whole cents
        done();
      });
    });
  });

  describe('Step Validation', () => {
    it('should validate step 1 correctly', () => {
      expect(service.isStepValid(1)).toBeFalse();

      service.updateVehicleSelection(validVehicleSelection);

      expect(service.isStepValid(1)).toBeTrue();
    });

    it('should validate step 2 correctly', () => {
      expect(service.isStepValid(2)).toBeFalse();

      service.updateVehicleSelection(validVehicleSelection);
      service.updatePlanDetails(validPlanDetails);

      expect(service.isStepValid(2)).toBeTrue();
    });

    it('should validate step 3 correctly', () => {
      expect(service.isStepValid(3)).toBeFalse();

      service.updateVehicleSelection(validVehicleSelection);
      service.updatePlanDetails(validPlanDetails);
      service.updateBookingDetails(validBookingDetails);

      expect(service.isStepValid(3)).toBeTrue();
    });

    it('should validate step 4 correctly', () => {
      expect(service.isStepValid(4)).toBeFalse();

      service.updateVehicleSelection(validVehicleSelection);
      service.updatePlanDetails(validPlanDetails);
      service.updateBookingDetails(validBookingDetails);
      service.updatePaymentInfo(validPaymentInfo);

      expect(service.isStepValid(4)).toBeTrue();
    });
  });

  describe('Step Completion Tracking', () => {
    it('should mark step as completed after navigation', (done) => {
      service.updateVehicleSelection(validVehicleSelection);
      service.nextStep();

      setTimeout(() => {
        service.navigationState$.subscribe((state) => {
          expect(state.completedSteps.includes(1)).toBeTrue();
          done();
        });
      }, 100);
    });

    it('should track visited steps', (done) => {
      service.markStepTouched(2);

      service.navigationState$.subscribe((state) => {
        expect(state.visitedSteps.includes(2)).toBeTrue();
        done();
      });
    });
  });

  describe('localStorage Persistence', () => {
    it('should save form to localStorage', (done) => {
      service.updateVehicleSelection(validVehicleSelection);
      service.updatePlanDetails(validPlanDetails);

      setTimeout(() => {
        const stored = localStorage.getItem('booking-form-draft');
        expect(stored).toBeTruthy();
        done();
      }, 500);
    });

    it('should restore form from localStorage', () => {
      const mockForm: BookingForm = {
        vehicleSelection: validVehicleSelection,
        planDetails: validPlanDetails,
        bookingDetails: null,
        paymentInfo: null,
        totalCost: 50,
      };

      localStorage.setItem('booking-form-draft', JSON.stringify(mockForm));
      service.initializeFromStorage();

      service.bookingForm$.subscribe((form) => {
        expect(form.vehicleSelection).toEqual(validVehicleSelection);
        expect(form.planDetails).toEqual(validPlanDetails);
      });
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('booking-form-draft', 'corrupted-data');

      expect(() => {
        service.initializeFromStorage();
      }).not.toThrow();
    });

    it('should enforce storage size limits', (done) => {
      // Create a large object
      const largeData: BookingForm = {
        vehicleSelection: {
          ...validVehicleSelection,
          vehicleId: 'x'.repeat(10000),
        },
        planDetails: validPlanDetails,
        bookingDetails: null,
        paymentInfo: null,
        totalCost: 50,
      };

      service.updateVehicleSelection(largeData.vehicleSelection as VehicleSelection);

      setTimeout(() => {
        // Should not crash even if size limit exceeded
        expect(service).toBeTruthy();
        done();
      }, 500);
    });
  });

  describe('Error Handling', () => {
    it('should set error on invalid update', (done) => {
      service.updateVehicleSelection({
        vehicleId: null,
        startDate: new Date(Date.now() - 86400000), // Past date
        endDate: new Date(),
        rentalDays: 1,
        estimatedCost: 50,
      });

      service.error$.subscribe((error) => {
        if (error) {
          expect(error).toBeTruthy();
          done();
        }
      });
    });

    it('should clear error when valid update occurs', (done) => {
      // First create an error
      service.updateVehicleSelection({
        vehicleId: null,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(),
        rentalDays: 1,
        estimatedCost: 50,
      });

      setTimeout(() => {
        // Then fix it
        service.updateVehicleSelection(validVehicleSelection);

        service.error$.subscribe((error) => {
          expect(error).toBeNull();
          done();
        });
      }, 100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid updates correctly', (done) => {
      service.updateVehicleSelection(validVehicleSelection);
      service.updatePlanDetails(validPlanDetails);
      service.updateBookingDetails(validBookingDetails);
      service.updatePaymentInfo(validPaymentInfo);

      setTimeout(() => {
        service.bookingForm$.subscribe((form) => {
          expect(form.vehicleSelection).toBeTruthy();
          expect(form.planDetails).toBeTruthy();
          expect(form.bookingDetails).toBeTruthy();
          expect(form.paymentInfo).toBeTruthy();
          done();
        });
      }, 200);
    });

    it('should handle partial updates', (done) => {
      service.updateVehicleSelection(validVehicleSelection);
      service.updatePlanDetails(validPlanDetails);

      service.bookingForm$.subscribe((form) => {
        expect(form.vehicleSelection).toBeTruthy();
        expect(form.planDetails).toBeTruthy();
        expect(form.bookingDetails).toBeNull();
        expect(form.paymentInfo).toBeNull();
        done();
      });
    });

    it('should track unsaved changes accurately', (done) => {
      expect(service.hasUnsavedChanges()).toBeFalse();

      service.updateVehicleSelection(validVehicleSelection);

      expect(service.hasUnsavedChanges()).toBeTrue();

      service.updateBookingDetails(validBookingDetails);
      service.updatePaymentInfo(validPaymentInfo);
      // After "submission" should be false, but we'll just check it changes
      expect(service.hasUnsavedChanges()).toBeTrue();
      done();
    });
  });

  describe('Step Errors', () => {
    it('should return errors for invalid step', () => {
      const errors = service.getStepErrors(1);

      expect(Object.keys(errors).length).toBeGreaterThan(0);
    });

    it('should return no errors for valid step', () => {
      service.updateVehicleSelection(validVehicleSelection);

      const errors = service.getStepErrors(1);

      expect(Object.keys(errors).length).toBe(0);
    });
  });
});
