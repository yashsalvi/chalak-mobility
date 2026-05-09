import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  CommonModule,
  formatDate,
} from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { VehicleSelection, Vehicle } from '../models/booking.model';
import { LucideAngularModule } from 'lucide-angular';
import { VehicleService } from '../services/vehicle.service';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

/**
 * Vehicle Selection Step Component
 * Handles vehicle selection, date range, and duration calculation
 */
@Component({
  selector: 'app-booking-vehicle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './booking-vehicle.html',
  styleUrls: ['./booking-vehicle.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingVehicle implements OnInit {
  @Input() formData: VehicleSelection | null = null;
  @Input() errors: Record<string, string> = {};
  @Output() updateData = new EventEmitter<VehicleSelection>();

  form!: FormGroup;
  vehicles: Vehicle[] = [];
  selectedVehicle: Vehicle | null = null;
  rentalDays = 0;
  estimatedCost = 0;
  dateRangeError = '';
  minDate = this.formatDateForInput(new Date(Date.now() + 172800000));
  isLoading = false;
  loadError = '';

  constructor(private fb: FormBuilder, private vehicleService: VehicleService) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadVehicles();

    // Populate form if data exists
    if (this.formData) {
      this.form.patchValue({
        vehicleId: this.formData.vehicleId,
        startDate: this.formatDateForInput(this.formData.startDate),
        endDate: this.formatDateForInput(this.formData.endDate),
      });

      if (this.formData.selectedVehicle) {
        this.selectedVehicle = this.formData.selectedVehicle;
      }

      this.calculateRentalDays();
      this.calculateEstimatedCost();
    }
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.loadError = '';

    this.vehicleService.getVehicles().pipe(
      catchError(error => {
        this.loadError = error.message || 'Failed to load vehicles';
        console.error('[BookingVehicle] Failed to load vehicles:', error);
        return of([]); // Return empty array on error
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(vehicles => {
      this.vehicles = vehicles;
      
      // Re-select vehicle if it was previously selected
      if (this.formData?.vehicleId) {
        const vehicle = vehicles.find(v => v.id === this.formData?.vehicleId);
        if (vehicle) {
          this.selectedVehicle = vehicle;
        }
      }
    });
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      vehicleId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });

    // Subscribe to form changes
    this.form.valueChanges.subscribe(() => {
      this.calculateRentalDays();
      this.calculateEstimatedCost();
      this.validateDateRange();
    });
  }

  selectVehicle(vehicleId: string): void {
    const vehicle = this.vehicles.find((v) => v.id === vehicleId);
    if (vehicle && vehicle.available) {
      this.selectedVehicle = vehicle;
      this.form.patchValue({ vehicleId });
      this.calculateEstimatedCost();
    }
  }

  calculateRentalDays(): void {
    const startDate = this.form.get('startDate')?.value;
    const endDate = this.form.get('endDate')?.value;

    if (!this.isDateInputValue(startDate) || !this.isDateInputValue(endDate)) {
      this.rentalDays = 0;
      this.estimatedCost = 0;
      this.dateRangeError = '';
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      this.rentalDays = 0;
      this.estimatedCost = 0;
      this.dateRangeError = 'End date must be later than start date.';
      return;
    }

    this.dateRangeError = '';
    this.rentalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  private validateDateRange(): void {
    const startDate = this.form.get('startDate')?.value;
    const endDate = this.form.get('endDate')?.value;

    if (!this.isDateInputValue(startDate) || !this.isDateInputValue(endDate)) {
      this.dateRangeError = '';
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      this.dateRangeError = 'End date must be later than start date.';
      return;
    }

    this.dateRangeError = '';
  }

  calculateEstimatedCost(): void {
    if (this.selectedVehicle && this.rentalDays > 0) {
      this.estimatedCost = this.selectedVehicle.pricePerDay * this.rentalDays;
      return;
    }

    this.estimatedCost = 0;
  }

  onNext(): void {
    if (
      this.form.invalid ||
      !this.selectedVehicle ||
      !!this.dateRangeError ||
      this.rentalDays <= 0
    ) {
      return;
    }

    const startDate = new Date(this.form.get('startDate')?.value);
    const endDate = new Date(this.form.get('endDate')?.value);

    if (endDate <= startDate) {
      this.dateRangeError = 'End date must be later than start date.';
      return;
    }

    this.updateData.emit({
      vehicleId: this.selectedVehicle.id,
      selectedVehicle: this.selectedVehicle,
      startDate,
      endDate,
      rentalDays: this.rentalDays,
      estimatedCost: this.estimatedCost,
    });
  }

  private formatDateForInput(date: Date | string | null): string {
    if (date == null) {
      return '';
    }

    if (typeof date === 'string') {
      if (this.isDateInputValue(date)) {
        return date;
      }

      const parsed = new Date(date);
      return Number.isNaN(parsed.getTime())
        ? ''
        : formatDate(parsed, 'yyyy-MM-dd', 'en-US');
    }

    return formatDate(date, 'yyyy-MM-dd', 'en-US');
  }

  private isDateInputValue(value: unknown): value is string {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  isVehicleSelected(vehicleId: string): boolean {
    return this.form.get('vehicleId')?.value === vehicleId;
  }

  hasError(field: string): boolean {
    return !!this.errors[field];
  }

  getError(field: string): string {
    return this.errors[field] || '';
  }
}
