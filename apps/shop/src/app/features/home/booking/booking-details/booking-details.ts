import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BookingDetails, BookingContactInfo, VALIDATION_RULES } from '../models/booking.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

/**
 * Booking Details Step Component
 * Handles contact information and location selection
 */
@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './booking-details.html',
  styleUrls: ['./booking-details.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingDetailsComponent implements OnInit {
  @Input() formData: BookingDetails | null = null;
  @Input() errors: Record<string, string> = {};
  @Output() updateData = new EventEmitter<BookingDetails>();

  form!: FormGroup;
  countryPhoneCodes = [
    { code: '+91', country: 'India' },
  ];

  locationTypes = [
    { value: 'hub', label: 'Chalak Hub' },
    { value: 'custom', label: 'Custom Address' },
  ];

  validationRules = VALIDATION_RULES;
  minAge = 18;

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Populate form if data exists
    if (this.formData) {
      this.form.patchValue({
        firstName: this.formData.contactInfo.firstName,
        lastName: this.formData.contactInfo.lastName,
        email: this.formData.contactInfo.email,
        phone: this.formData.contactInfo.phone,
        phoneCountryCode: this.formData.contactInfo.phoneCountryCode,
        dateOfBirth: this.formatDateForInput(this.formData.contactInfo.dateOfBirth),
        licenseNumber: this.formData.contactInfo.licenseNumber,
        licenseCountry: this.formData.contactInfo.licenseCountry,
        licenseExpiryDate: this.formatDateForInput(this.formData.contactInfo.licenseExpiryDate),
        pickupType: this.formData.pickupLocation.locationType,
        pickupAddress: this.formData.pickupLocation.address,
        pickupCity: this.formData.pickupLocation.city,
        dropoffType: this.formData.dropoffLocation.locationType,
        dropoffAddress: this.formData.dropoffLocation.address,
        dropoffCity: this.formData.dropoffLocation.city,
      });
    }
  }

  private initializeForm(): void {
    const today = new Date();
    const maxDateOfBirth = new Date(
      today.getFullYear() - this.minAge,
      today.getMonth(),
      today.getDate()
    );

    this.form = this.fb.group({
      // Contact Info
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      phoneCountryCode: ['+91', Validators.required],
      dateOfBirth: ['', Validators.required],
      licenseNumber: ['', [Validators.required, Validators.minLength(5)]],
      licenseCountry: ['IN', Validators.required],
      licenseExpiryDate: ['', Validators.required],

      // Pickup Location
      pickupType: ['hub', Validators.required],
      pickupAddress: [''],
      pickupCity: [''],

      // Dropoff Location
      dropoffType: ['hub', Validators.required],
      dropoffAddress: [''],
      dropoffCity: [''],

    });
  }

  onNext(): void {
    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value;
    const details: BookingDetails = {
      contactInfo: {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone,
        phoneCountryCode: formValue.phoneCountryCode,
        dateOfBirth: new Date(formValue.dateOfBirth),
        licenseNumber: formValue.licenseNumber,
        licenseCountry: formValue.licenseCountry,
        licenseExpiryDate: new Date(formValue.licenseExpiryDate),
      },
      pickupLocation: {
        locationType: formValue.pickupType,
        address: formValue.pickupAddress,
        city: formValue.pickupCity,
      },
      dropoffLocation: {
        locationType: formValue.dropoffType,
        address: formValue.dropoffAddress,
        city: formValue.dropoffCity,
      },
    };

    this.updateData.emit(details);
  }

  hasError(field: string): boolean {
    return !!this.errors[field];
  }

  getError(field: string): string {
    return this.errors[field] || '';
  }

  private formatDateForInput(date: Date | string | null): string {
    if (!date) {
      return '';
    }
    if (typeof date === 'string') {
      return date;
    }
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }
}
