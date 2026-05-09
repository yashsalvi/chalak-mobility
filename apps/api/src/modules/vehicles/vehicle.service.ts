import { Vehicle, VehicleAvailability, AvailabilityFilter, VehicleAvailabilityResponse } from './vehicle.types';

export class VehicleService {
  private vehicles: Vehicle[] = this.generateVehicleFleet();
  private availability: Map<string, VehicleAvailability> = new Map();

  constructor() {
    this.initializeAvailability();
  }

  private generateVehicleFleet(): Vehicle[] {
    return [
      // Scooters
      {
        id: 'scooter-001',
        name: 'Electric Scooter (Personal)',
        type: 'scooter',
        pricePerDay: 110,
        available: true,
        specifications: {
          range: 65,
          topSpeed: 45,
          loadCapacity: 150,
          chargingTime: 4,
        },
        features: ['LED Display', 'Disc Brakes', 'Mobile App Control', 'GPS Tracking'],
        description: 'Perfect for daily commuting and short trips around the city.',
      },
      {
        id: 'scooter-002',
        name: 'Electric Scooter (Premium)',
        type: 'scooter',
        pricePerDay: 140,
        available: true,
        specifications: {
          range: 80,
          topSpeed: 55,
          loadCapacity: 180,
          chargingTime: 3,
        },
        features: ['LED Display', 'Disc Brakes', 'Mobile App Control', 'GPS Tracking', 'Fast Charging', 'Cruise Control'],
        description: 'Premium scooter with extended range and additional comfort features.',
      },
      // Delivery Vehicles
      {
        id: 'delivery-001',
        name: 'Delivery EV (Partner)',
        type: 'delivery',
        pricePerDay: 220,
        available: true,
        specifications: {
          range: 120,
          topSpeed: 70,
          loadCapacity: 500,
          chargingTime: 6,
        },
        features: ['Large Cargo Box', 'Refrigeration Option', 'GPS Tracking', 'Driver Cabin', 'Load Securing System'],
        description: 'Ideal for delivery businesses and last-mile logistics.',
      },
      {
        id: 'delivery-002',
        name: 'Delivery EV (Heavy Duty)',
        type: 'delivery',
        pricePerDay: 280,
        available: true,
        specifications: {
          range: 100,
          topSpeed: 65,
          loadCapacity: 750,
          chargingTime: 8,
        },
        features: ['Extra Large Cargo Box', 'Refrigeration Option', 'GPS Tracking', 'Driver Cabin', 'Load Securing System', 'Hydraulic Lift'],
        description: 'Heavy-duty delivery vehicle for larger cargo requirements.',
      },
      // Tempo Vehicles
      {
        id: 'tempo-001',
        name: 'Electric Tempo (Cargo)',
        type: 'tempo',
        pricePerDay: 350,
        available: true,
        specifications: {
          range: 150,
          topSpeed: 60,
          loadCapacity: 1000,
          chargingTime: 8,
        },
        features: ['Spacious Cargo Area', 'Side Door Access', 'GPS Tracking', 'Driver Cabin', 'Load Securing System', 'Tilt Steering'],
        description: 'Perfect for small businesses and bulk goods transportation.',
      },
      {
        id: 'tempo-002',
        name: 'Electric Tempo (Passenger)',
        type: 'tempo',
        pricePerDay: 400,
        available: true,
        specifications: {
          range: 140,
          topSpeed: 60,
          loadCapacity: 800, // Passenger weight capacity
          chargingTime: 8,
        },
        features: ['Seating for 8 Passengers', 'Air Conditioning', 'GPS Tracking', 'Driver Cabin', 'Entertainment System', 'Safety Rails'],
        description: 'Comfortable passenger transport for groups and families.',
      },
    ];
  }

  private initializeAvailability(): void {
    this.vehicles.forEach(vehicle => {
      this.availability.set(vehicle.id, {
        vehicleId: vehicle.id,
        available: true,
        unavailableDates: [],
      });
    });
  }

  getAll(filter?: AvailabilityFilter): VehicleAvailabilityResponse {
    let filteredVehicles = [...this.vehicles];

    if (filter) {
      // Filter by vehicle type
      if (filter.vehicleType) {
        filteredVehicles = filteredVehicles.filter(v => v.type === filter.vehicleType);
      }

      // Filter by price range
      if (filter.minPrice !== undefined) {
        filteredVehicles = filteredVehicles.filter(v => v.pricePerDay >= filter.minPrice);
      }
      if (filter.maxPrice !== undefined) {
        filteredVehicles = filteredVehicles.filter(v => v.pricePerDay <= filter.maxPrice);
      }

      // Filter by availability for given date range
      if (filter.startDate && filter.endDate) {
        filteredVehicles = filteredVehicles.filter(vehicle => {
          const availability = this.availability.get(vehicle.id);
          if (!availability || !availability.available) return false;

          // Check if any dates in the range are unavailable
          if (availability.unavailableDates) {
            const start = new Date(filter.startDate);
            const end = new Date(filter.endDate);
            
            for (const dateStr of availability.unavailableDates) {
              const unavailableDate = new Date(dateStr);
              if (unavailableDate >= start && unavailableDate <= end) {
                return false;
              }
            }
          }

          return true;
        });
      }
    }

    const vehiclesWithAvailability = filteredVehicles.map(vehicle => ({
      ...vehicle,
      availability: this.availability.get(vehicle.id)!,
    }));

    return {
      vehicles: vehiclesWithAvailability,
      totalAvailable: vehiclesWithAvailability.length,
      filter: filter || {},
    };
  }

  getById(id: string): Vehicle | null {
    return this.vehicles.find(v => v.id === id) || null;
  }

  getAvailability(vehicleId: string): VehicleAvailability | null {
    return this.availability.get(vehicleId) || null;
  }

  updateAvailability(vehicleId: string, availability: Partial<VehicleAvailability>): boolean {
    const current = this.availability.get(vehicleId);
    if (!current) return false;

    const updated = { ...current, ...availability };
    this.availability.set(vehicleId, updated);

    // Update vehicle available status
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.available = updated.available;
    }

    return true;
  }

  getVehicleTypes(): Vehicle['type'][] {
    return ['scooter', 'delivery', 'tempo'];
  }

  getPriceRange(): { min: number; max: number } {
    const prices = this.vehicles.map(v => v.pricePerDay);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }
}

export const vehicleService = new VehicleService();
