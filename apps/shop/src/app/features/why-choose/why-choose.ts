import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule
} from 'lucide-angular';

@Component({
  selector: 'app-why-choose',
  standalone: true,
  imports: [
    CommonModule,
LucideAngularModule
  ],
  templateUrl: './why-choose.html',
  styleUrl: './why-choose.css',
})
export class WhyChoose {
  features = [
    {
      title: 'Low Cost',
      desc: 'Save more with EV rentals',
      icon: 'wallet'
    },
    {
      title: 'EV Savings',
      desc: 'Lower running cost, higher earnings',
      icon: 'zap'
    },
    {
      title: 'Maintenance Included',
      desc: 'No extra cost for servicing',
      icon: 'wrench'
    },
    {
      title: 'Fast Booking',
      desc: 'Get started in minutes',
      icon: 'phone'
    }
  ];
}