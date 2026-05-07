import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.css',
})
export class Vehicles {
  vehicles = [
    {
      name: 'Electric Scooter',
      price: 110,
      image: 'assets/scooter.webp',
      tag: 'Most Popular'
    },
    {
      name: 'Electric Tempo',
      price: 350,
      image: 'assets/tempo.webp',
      tag: 'For Business'
    },
    {
      name: 'Delivery EV',
      price: 220,
      image: 'assets/delivery.webp',
      tag: 'High Demand'
    }
  ];
}