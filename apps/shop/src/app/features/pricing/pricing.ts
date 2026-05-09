import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './pricing.html',
  styleUrl: './pricing.css',
})
export class Pricing {
  plans = [
    {
      name: 'pricing.daily.title',
      price: 110,
      desc: 'pricing.daily.description',
      highlight: true,
      features: [
        'pricing.daily.features.commitment',
        'pricing.daily.features.maintenance',
        'pricing.daily.features.flexible'
      ]
    },
    {
      name: 'pricing.weekly.title',
      price: 700,
      desc: 'pricing.weekly.description',
      highlight: false,
      features: [
        'pricing.weekly.features.cost',
        'pricing.weekly.features.support',
        'pricing.weekly.features.ideal'
      ]
    },
    {
      name: 'pricing.monthly.title',
      price: 2500,
      desc: 'pricing.monthly.description',
      highlight: false,
      features: [
        'pricing.monthly.features.value',
        'pricing.monthly.features.usage',
        'pricing.monthly.features.business'
      ]
    }
  ];
}