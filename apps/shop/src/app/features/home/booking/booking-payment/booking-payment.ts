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
import { LucideAngularModule } from 'lucide-angular';
import { PaymentInfo, BookingCost, PaymentMethod } from '../models/booking.model';

@Component({
  selector: 'app-booking-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './booking-payment.html',
  styleUrls: ['./booking-payment.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingPaymentComponent implements OnInit {
  @Input() formData: PaymentInfo | null = null;
  @Input() errors: Record<string, string> = {};
  @Input() totalCost = 0;
  @Input() costBreakdown: BookingCost | null = null;
  @Output() updateData = new EventEmitter<PaymentInfo>();

  form!: FormGroup;
  showCardForm = false;
  paymentMethods: Array<{ value: PaymentMethod; label: string; icon: string }> = [
    { value: 'upi', label: 'UPI', icon: '₹' },
    { value: 'bank-transfer', label: 'Bank Transfer', icon: '₹' },
    { value: 'cash', label: 'Pay at Hub', icon: '₹' },
  ];

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  ngOnInit(): void {
    if (this.formData) {
      this.form.patchValue(this.formData);
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      method: ['upi', Validators.required],
      cardNumber: [''],
      cardHolder: [''],
      expiryDate: [''],
      cvv: [''],
      saveCard: [false],
      agreeToAutomaticPayment: [false, Validators.requiredTrue],
    });
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.form.patchValue({ method });
    this.showCardForm = false;
  }

  formatCardNumber(event: any): void {
    const value = event.target.value.replace(/\s/g, '');
    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
    this.form.patchValue({ cardNumber: formatted }, { emitEvent: false });
  }

  onNext(): void {
    if (this.form.invalid) {
      return;
    }

    this.updateData.emit(this.form.value);
  }

  hasError(field: string): boolean {
    return !!this.errors[field];
  }

  getError(field: string): string {
    return this.errors[field] || '';
  }

  maskCardNumber(cardNumber: string): string {
    if (!cardNumber) return '';
    const last4 = cardNumber.replace(/\s/g, '').slice(-4);
    return `**** **** **** ${last4}`;
  }
}
