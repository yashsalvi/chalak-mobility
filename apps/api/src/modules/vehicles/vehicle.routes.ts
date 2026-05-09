import { Router } from 'express';
import { vehicleService } from './vehicle.service';
import { validateRequest } from '../../server/validation';
import { z } from 'zod';

const availabilityFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  vehicleType: z.enum(['scooter', 'delivery', 'tempo']).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
});

const vehicleIdParamsSchema = z.object({
  id: z.string().min(1, 'Vehicle ID is required'),
});

const vehicleAvailabilityUpdateSchema = z.object({
  available: z.boolean(),
  unavailableDates: z.array(z.string().datetime()).optional(),
  reason: z.string().optional(),
});

export const vehiclesRouter = Router();

// GET /api/vehicles - Get all vehicles with optional filtering
vehiclesRouter.get('/', (req, res) => {
  try {
    const filter = availabilityFilterSchema.parse(req.query);
    const result = vehicleService.getAll(filter);

    res.json({
      success: true,
      data: result.vehicles,
      totalAvailable: result.totalAvailable,
      filter: result.filter,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.issues,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/vehicles/types - Get available vehicle types
vehiclesRouter.get('/types', (_req, res) => {
  try {
    const types = vehicleService.getVehicleTypes();
    res.json({
      success: true,
      data: types,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle types',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/vehicles/price-range - Get price range for all vehicles
vehiclesRouter.get('/price-range', (_req, res) => {
  try {
    const priceRange = vehicleService.getPriceRange();
    res.json({
      success: true,
      data: priceRange,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price range',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/vehicles/:id - Get specific vehicle by ID
vehiclesRouter.get('/:id', validateRequest('params', vehicleIdParamsSchema), (req, res) => {
  try {
    const vehicle = vehicleService.getById(req.params.id);
    
    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
      return;
    }

    const availability = vehicleService.getAvailability(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...vehicle,
        availability,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/vehicles/:id/availability - Get availability for specific vehicle
vehiclesRouter.get('/:id/availability', validateRequest('params', vehicleIdParamsSchema), (req, res) => {
  try {
    const availability = vehicleService.getAvailability(req.params.id);
    
    if (!availability) {
      res.status(404).json({
        success: false,
        message: 'Vehicle availability not found',
      });
      return;
    }

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle availability',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PATCH /api/vehicles/:id/availability - Update vehicle availability (admin endpoint)
vehiclesRouter.patch(
  '/:id/availability',
  validateRequest('params', vehicleIdParamsSchema),
  validateRequest('body', vehicleAvailabilityUpdateSchema),
  (req, res) => {
    try {
      const updated = vehicleService.updateAvailability(req.params.id, req.body);
      
      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Vehicle not found',
        });
        return;
      }

      const availability = vehicleService.getAvailability(req.params.id);
      
      res.json({
        success: true,
        message: 'Vehicle availability updated successfully',
        data: availability,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle availability',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
