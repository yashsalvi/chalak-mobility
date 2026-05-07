import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-business',
  standalone: true,
  imports: [
    CommonModule,
LucideAngularModule
  ],
  templateUrl: './business.html',
  styleUrl: './business.css',
})
export class Business {
  benefits = [
    {
      title: 'Scale Faster',
      desc: 'Expand your delivery fleet instantly',
      icon: 'truck'
    },
    {
      title: 'Increase Profit',
      desc: 'Reduce fuel cost with EV savings',
      icon: 'profit'
    },
    {
      title: 'Reliable Fleet',
      desc: 'Well-maintained vehicles ready to go',
      icon: 'secure'
    }
  ];
}