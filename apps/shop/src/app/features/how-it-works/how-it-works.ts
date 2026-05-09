import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule
} from 'lucide-angular';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.css',
})
export class HowItWorks {
  steps = [
    {
      title: 'Book Online',
      desc: 'Select your vehicle and plan in seconds',
      icon: 'book'
    },
    {
      title: 'Pick Vehicle',
      desc: 'Collect your EV from nearest hub',
      icon: 'pickup'
    },
    {
      title: 'Start Earning',
      desc: 'Drive and earn with zero hassle',
      icon: 'earn'
    }
  ];
}