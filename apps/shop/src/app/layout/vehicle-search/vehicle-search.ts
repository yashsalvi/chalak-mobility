import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';

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
  isLoading = false;

  constructor(private fb: FormBuilder, private elementRef: ElementRef<HTMLElement>, private http: HttpClient) {}

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

  async ngOnInit() {
    this.searchForm = this.fb.group({
      query: [''],
      type: [''],
    });

    await this.loadVehicles();
  }

  async loadVehicles() {
    this.isLoading = true;
    try {
      const response = await this.http.get<any>('http://localhost:3333/api/products').toPromise();
      this.vehicles = response.body?.items || [];
      this.filteredVehicles = this.vehicles;
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      this.vehicles = [];
      this.filteredVehicles = [];
    } finally {
      this.isLoading = false;
    }
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
