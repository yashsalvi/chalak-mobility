import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  price: number;
  image?: string;
}

@Component({
  selector: 'app-vehicle-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './vehicle-search.html',
  styleUrl: './vehicle-search.css',
})
export class VehicleSearch implements OnInit {
  searchForm!: FormGroup;
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  isOpen = false;

  // Mock data - replace with API call
  mockVehicles: Vehicle[] = [
    { id: '1', name: 'Electric Scooter', type: 'Scooter', price: 110 },
    { id: '2', name: 'Electric Tempo', type: 'Tempo', price: 350 },
    { id: '3', name: 'Delivery EV', type: 'Delivery', price: 220 },
  ];

  constructor(private fb: FormBuilder, private elementRef: ElementRef<HTMLElement>) {}

  @HostListener('document:mousedown', ['$event'])
  @HostListener('document:touchstart', ['$event'])
  handleOutsideClick(event: Event) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (this.isOpen && keyboardEvent.key === 'Escape') {
      this.isOpen = false;
    }
  }

  ngOnInit() {
    this.searchForm = this.fb.group({
      query: [''],
      type: [''],
    });

    this.vehicles = this.mockVehicles;
    this.filteredVehicles = this.vehicles;

    this.searchForm.get('query')?.valueChanges.subscribe(() => this.filterVehicles());
    this.searchForm.get('type')?.valueChanges.subscribe(() => this.filterVehicles());
  }

  filterVehicles() {
    const query = (this.searchForm.get('query')?.value || '').toLowerCase();
    const type = this.searchForm.get('type')?.value || '';

    this.filteredVehicles = this.vehicles.filter((v) => {
      const matchesQuery = v.name.toLowerCase().includes(query) || v.type.toLowerCase().includes(query);
      const matchesType = !type || v.type === type;
      return matchesQuery && matchesType;
    });
  }

  selectVehicle(vehicle: Vehicle) {
    console.log('Selected vehicle:', vehicle);
    // Navigate to booking or vehicle detail
    this.isOpen = false;
  }

  toggleSearch() {
    this.isOpen = !this.isOpen;
  }

  onQueryChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchForm.get('query')?.setValue(value, { emitEvent: true });
  }

  onTypeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.searchForm.get('type')?.setValue(value, { emitEvent: true });
  }
}
