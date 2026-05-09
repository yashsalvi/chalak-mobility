export interface Vehicle {
  id: string;
  name: string;
  type: 'scooter' | 'delivery' | 'tempo';
  pricePerDay: number;
  available: boolean;
  specifications: {
    range: number; // in km
    topSpeed: number; // in km/h
    loadCapacity: number; // in kg
    chargingTime: number; // in hours
  };
  features: string[];
  imageUrl?: string;
  description: string;
}

export interface VehicleAvailability {
  vehicleId: string;
  available: boolean;
  unavailableDates?: string[]; // ISO date strings
  reason?: string;
}

export interface AvailabilityFilter {
  startDate?: string;
  endDate?: string;
  vehicleType?: Vehicle['type'];
  minPrice?: number;
  maxPrice?: number;
}

export interface VehicleAvailabilityResponse {
  vehicles: (Vehicle & { availability: VehicleAvailability })[];
  totalAvailable: number;
  filter: AvailabilityFilter;
}
