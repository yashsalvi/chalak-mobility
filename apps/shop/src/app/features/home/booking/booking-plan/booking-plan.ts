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
import {
  PlanDetails,
  INSURANCE_PLANS,
  RIDE_TYPES,
  InsurancePlan,
} from '../models/booking.model';
import { LucideAngularModule } from 'lucide-angular';

/**
 * Plan Selection Step Component
 * Handles insurance plan and ride type selection
 */
@Component({
  selector: 'app-booking-plan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './booking-plan.html',
  styleUrls: ['./booking-plan.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingPlan implements OnInit {
  @Input() formData: PlanDetails | null = null;
  @Input() errors: Record<string, string> = {};
  @Input() baseCost = 0;
  @Output() updateData = new EventEmitter<PlanDetails>();

  form!: FormGroup;
  insurancePlans = INSURANCE_PLANS;
  rideTypes = RIDE_TYPES;
  selectedAddons: Set<string> = new Set();
  addonsList: Array<{ id: string; name: string; cost: number }> = [];

  get selectedInsuranceCost(): number {
    const insuranceType = this.form.get('insuranceType')
      ?.value as InsurancePlan | null | undefined;
    if (!insuranceType) {
      return 0;
    }
    return INSURANCE_PLANS[insuranceType]?.cost ?? 0;
  }

  get selectedAddonsCost(): number {
    return Array.from(this.selectedAddons).reduce((sum, addonId) => {
      const addon = this.addonsList.find((a) => a.id === addonId);
      return sum + (addon?.cost || 0);
    }, 0);
  }

  get totalPlanCost(): number {
    return this.baseCost + this.selectedInsuranceCost + this.selectedAddonsCost;
  }

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Populate form if data exists
    if (this.formData) {
      this.form.patchValue({
        insuranceType: this.formData.insuranceType,
        rideType: this.formData.rideType,
      });

      if (this.formData.addons) {
        this.selectedAddons = new Set(this.formData.addons);
      }
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      insuranceType: ['basic', Validators.required],
      rideType: ['standard', Validators.required],
    });
  }

  toggleAddon(addonId: string): void {
    if (this.selectedAddons.has(addonId)) {
      this.selectedAddons.delete(addonId);
    } else {
      this.selectedAddons.add(addonId);
    }
  }

  hasAddon(addonId: string): boolean {
    return this.selectedAddons.has(addonId);
  }

  getAddonCost(addonId: string): number {
    const addon = this.addonsList.find((a) => a.id === addonId);
    return addon?.cost || 0;
  }

  getInsuranceCoverage(type: string): string {
    return INSURANCE_PLANS[type as InsurancePlan]?.coverage ?? '';
  }

  onNext(): void {
    if (this.form.invalid) {
      return;
    }

    this.updateData.emit({
      insuranceType: this.form.get('insuranceType')?.value,
      rideType: this.form.get('rideType')?.value,
      addons: Array.from(this.selectedAddons),
    });
  }

  hasError(field: string): boolean {
    return !!this.errors[field];
  }

  getError(field: string): string {
    return this.errors[field] || '';
  }
}
