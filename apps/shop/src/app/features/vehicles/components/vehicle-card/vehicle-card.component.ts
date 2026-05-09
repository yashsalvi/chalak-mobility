import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  price: number;
  image?: string;
  tag?: string;
  features?: string[];
}

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="card" (click)="navigateToVehicle(vehicle.id)">
      <div class="image">
        <img [src]="vehicle.image || 'assets/default-vehicle.webp'" [alt]="vehicle.name | translate" />
        <span *ngIf="vehicle.tag" class="badge">{{ vehicle.tag | translate }}</span>
      </div>
      <div class="content">
        <h3>{{ vehicle.name | translate }}</h3>
        <p>{{ vehicle.type }}</p>
        <div class="price">
          ₹{{ vehicle.price }} <span>/ {{ 'vehicles.perDay' | translate }}</span>
        </div>
        <div *ngIf="vehicle.features && vehicle.features.length > 0" class="features">
          <div *ngFor="let feature of vehicle.features.slice(0, 2)" class="feature">
            {{ feature | translate }}
          </div>
        </div>
        <button class="btn-primary">
          {{ 'vehicles.viewDetails' | translate }}
        </button>
      </div>
    </div>
  `,
  styleUrl: './vehicle-card.component.css'
})
export class VehicleCard {
  @Input() vehicle: Vehicle = {} as Vehicle;

  constructor(private router: Router) {}

  navigateToVehicle(vehicleId: string) {
    this.router.navigate(['/vehicles', vehicleId]);
  }
}
