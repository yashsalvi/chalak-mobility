import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { VehicleCard } from './components/vehicle-card/vehicle-card.component';

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
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, TranslatePipe, VehicleCard],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.css',
})
export class Vehicles {
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
}