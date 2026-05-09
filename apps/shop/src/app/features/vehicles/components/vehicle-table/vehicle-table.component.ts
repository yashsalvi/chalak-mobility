import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  selector: 'app-vehicle-table',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="vehicle-table-container">
      <h2>{{ title | translate }}</h2>
      <div class="table-responsive">
        <table class="vehicle-table">
          <thead>
            <tr>
              <th>{{ 'vehicles.table.type' | translate }}</th>
              <th>{{ 'vehicles.table.name' | translate }}</th>
              <th>{{ 'vehicles.table.price' | translate }}</th>
              <th>{{ 'vehicles.table.features' | translate }}</th>
              <th>{{ 'vehicles.table.action' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let vehicle of vehicles">
              <td>{{ vehicle.type | translate }}</td>
              <td>{{ vehicle.name | translate }}</td>
              <td>₹{{ vehicle.price }}/{{ 'vehicles.perDay' | translate }}</td>
              <td>
                <ul class="features-list">
                  <li *ngFor="let feature of vehicle.features">{{ feature | translate }}</li>
                </ul>
              </td>
              <td>
                <button class="btn-primary" (click)="selectVehicle(vehicle)">
                  {{ 'vehicles.bookNow' | translate }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styleUrl: './vehicle-table.component.css'
})
export class VehicleTable {
  @Input() vehicles: Vehicle[] = [];
  @Input() title: string = '';
  
  selectVehicle(vehicle: Vehicle) {
    console.log('Selected vehicle:', vehicle);
    // Navigate to booking or emit event
  }
}
