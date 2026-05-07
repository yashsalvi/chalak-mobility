import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pricing.html',
  styleUrl: './pricing.css',
})
export class Pricing {
  plans = [
    {
      name: 'Daily',
      price: 110,
      desc: 'Best for short rides',
      highlight: true,
      features: [
        'No long commitment',
        'Maintenance included',
        'Flexible usage'
      ]
    },
    {
      name: 'Weekly',
      price: 700,
      desc: 'Save more on weekly usage',
      highlight: false,
      features: [
        'Lower daily cost',
        'Priority support',
        'Ideal for gig work'
      ]
    },
    {
      name: 'Monthly',
      price: 2500,
      desc: 'Maximum savings plan',
      highlight: false,
      features: [
        'Best value',
        'Long-term usage',
        'Business friendly'
      ]
    }
  ];
}