import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { VehicleTable } from '../components/vehicle-table/vehicle-table.component';

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
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule, TranslatePipe, VehicleTable],
  template: `
    <div class="vehicle-detail">
      <div class="container">
        <button class="back-btn" (click)="goBack()">
          ← {{ 'vehicles.back' | translate }}
        </button>
        
        <div class="vehicle-header" *ngIf="vehicle">
          <div class="vehicle-image">
            <img [src]="vehicle.image || 'assets/default-vehicle.webp'" [alt]="vehicle.name | translate" />
            <span *ngIf="vehicle.tag" class="badge">{{ vehicle.tag | translate }}</span>
          </div>
          
          <div class="vehicle-info">
            <h1>{{ vehicle.name | translate }}</h1>
            <p class="vehicle-type">{{ vehicle.type }}</p>
            <div class="price">
              ₹{{ vehicle.price }} <span>/ {{ 'vehicles.perDay' | translate }}</span>
            </div>
            
            <div *ngIf="vehicle.features && vehicle.features.length > 0" class="features">
              <h3>{{ 'vehicles.features' | translate }}</h3>
              <div class="feature-list">
                <div *ngFor="let feature of vehicle.features" class="feature-item">
                  {{ feature | translate }}
                </div>
              </div>
            </div>
            
            <button class="btn-primary book-btn" (click)="bookVehicle()">
              {{ 'vehicles.bookNow' | translate }}
            </button>
          </div>
        </div>
        
        <div class="vehicle-table-section" *ngIf="vehicle">
          <h2>{{ 'vehicles.similarVehicles' | translate }}</h2>
          <app-vehicle-table 
            [vehicles]="getSimilarVehicles()"
            [title]="'vehicles.similarVehicles' | translate">
          </app-vehicle-table>
        </div>
      </div>
    </div>
  `,
  styleUrl: './vehicle-detail.component.css'
})
export class VehicleDetailComponent implements OnInit {
  vehicle: Vehicle | null = null;
  
  // Sample vehicles data - in a real app this would come from a service
  allVehicles: Vehicle[] = [
    {
      id: 'scooter-001',
      name: 'vehicles.electricScooter',
      type: 'Scooter',
      price: 110,
      image: 'assets/scooter.webp',
      tag: 'home.fleet.mostPopular',
      features: [
        'vehicles.features.range',
        'vehicles.features.speed',
        'vehicles.features.efficient'
      ]
    },
    {
      id: 'tempo-001',
      name: 'vehicles.electricTempo',
      type: 'Electric Tempo',
      price: 350,
      image: 'assets/tempo.webp',
      tag: 'home.fleet.forBusiness',
      features: [
        'vehicles.features.capacity',
        'vehicles.features.power',
        'vehicles.features.heavy'
      ]
    },
    {
      id: 'delivery-001',
      name: 'vehicles.deliveryEV',
      type: 'Delivery EV',
      price: 220,
      image: 'assets/delivery.webp',
      tag: 'home.fleet.highDemand',
      features: [
        'vehicles.features.cargo',
        'vehicles.features.delivery',
        'vehicles.features.reliable'
      ]
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const vehicleId = this.route.snapshot.paramMap.get('id');
    if (vehicleId) {
      this.vehicle = this.allVehicles.find(v => v.id === vehicleId) || null;
    }
    
    if (!this.vehicle) {
      this.router.navigate(['/']);
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  bookVehicle() {
    if (this.vehicle) {
      this.router.navigate(['/booking'], { queryParams: { vehicleId: this.vehicle.id } });
    }
  }

  getSimilarVehicles(): Vehicle[] {
    if (!this.vehicle) return [];
    
    return this.allVehicles
      .filter(v => v.id !== this.vehicle!.id && v.type === this.vehicle!.type)
      .slice(0, 3);
  }
}
