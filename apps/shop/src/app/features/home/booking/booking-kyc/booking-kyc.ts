import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { KycDetails } from '../models/booking.model';

@Component({
  selector: 'app-booking-kyc',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-kyc.html',
  styleUrl: './booking-kyc.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingKyc implements OnInit {
  @Input() formData: KycDetails | null = null;
  @Input() errors: Record<string, string> = {};
  @Output() updateData = new EventEmitter<KycDetails>();

  form!: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      aadhaarNumber: [
        '',
        [Validators.required, Validators.pattern(/^\d{12}$/)],
      ],
      aadhaarVerificationStatus: ['pending', Validators.required],
      drivingLicenseUploadStatus: ['uploaded', Validators.required],
      drivingLicenseDocumentId: [''],
      agreeToTerms: [false, Validators.requiredTrue],
      agreeToPenaltyPolicy: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    if (!this.formData) {
      return;
    }

    this.form.patchValue({
      aadhaarNumber: this.formData.aadhaarNumber,
      aadhaarVerificationStatus: this.formData.aadhaarVerificationStatus,
      drivingLicenseUploadStatus: this.formData.drivingLicenseUploadStatus,
      drivingLicenseDocumentId: this.formData.drivingLicenseDocumentId ?? '',
      agreeToTerms: this.formData.agreeToTerms,
      agreeToPenaltyPolicy: this.formData.agreeToPenaltyPolicy,
    });
  }

  onNext(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.value;
    this.updateData.emit({
      aadhaarNumber: value.aadhaarNumber,
      aadhaarVerificationStatus: value.aadhaarVerificationStatus,
      drivingLicenseUploadStatus: value.drivingLicenseUploadStatus,
      drivingLicenseDocumentId: value.drivingLicenseDocumentId || undefined,
      agreeToTerms: value.agreeToTerms,
      agreeToPenaltyPolicy: value.agreeToPenaltyPolicy,
      agreementVersion: 'v1.0.0',
      acceptedAt: new Date().toISOString(),
    });
  }

  hasError(field: string): boolean {
    return !!this.errors[field];
  }

  getError(field: string): string {
    return this.errors[field] || '';
  }
}
