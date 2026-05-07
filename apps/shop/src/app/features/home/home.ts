import { Component } from '@angular/core';

// import sections
import { Hero } from '../hero/hero';
import { Vehicles } from '../vehicles/vehicles';
import { Pricing } from '../pricing/pricing';
import { WhyChoose } from '../why-choose/why-choose';
import { HowItWorks } from '../how-it-works/how-it-works';
import { Business } from '../business/business';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    Hero,
    Vehicles,
    Pricing,
    WhyChoose,
    HowItWorks,
    Business
  ],
  templateUrl: './home.html',
})
export class Home {}