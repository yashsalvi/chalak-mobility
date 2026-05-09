import express from 'express';
import { bookingsRouter } from '../modules/bookings/booking.routes';
import { vehiclesRouter } from '../modules/vehicles/vehicle.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { paymentRouter } from '../modules/payment/payment.routes';

// Define types inline to avoid import issues
interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  searchTerm?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export const app = express();

app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.get('/', (_req, res) => {
  res.json({
    message: 'Chalak API is running',
    version: 'v1',
  });
});

app.use('/api/bookings', bookingsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/auth', authRouter);
app.use('/api/payments', paymentRouter);

// Mock service functions
const productsService = {
  getAllProducts: (filter: ProductFilter, page: number, pageSize: number) => {
    // Mock vehicle data
    const mockVehicles = [
      {
        id: 'scooter-001',
        name: 'Electric Scooter',
        price: 110,
        category: 'Scooter',
        inStock: true
      },
      {
        id: 'tempo-001', 
        name: 'Electric Tempo',
        price: 350,
        category: 'Electric Tempo',
        inStock: true
      },
      {
        id: 'delivery-001',
        name: 'Delivery EV', 
        price: 220,
        category: 'Delivery EV',
        inStock: true
      }
    ];

    // Apply filters
    let filteredVehicles = mockVehicles;
    if (filter.category) {
      filteredVehicles = filteredVehicles.filter(v => v.category === filter.category);
    }
    if (filter.minPrice) {
      filteredVehicles = filteredVehicles.filter(v => v.price >= filter.minPrice!);
    }
    if (filter.maxPrice) {
      filteredVehicles = filteredVehicles.filter(v => v.price <= filter.maxPrice!);
    }
    if (filter.searchTerm) {
      filteredVehicles = filteredVehicles.filter(v => 
        v.name.toLowerCase().includes(filter.searchTerm!.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = filteredVehicles.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      total: filteredVehicles.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredVehicles.length / pageSize)
    };
  },
  getProductById: (id: string) => ({
    id,
    name: 'Mock Product',
    price: 100,
    category: 'EV',
    inStock: true
  }),
  getCategories: () => ['Scooter', 'Electric Bike', 'Electric Tempo', 'Delivery EV'],
  getPriceRange: () => ({ min: 50, max: 500 })
};

app.get('/api/products', (req, res) => {
  try {
    const filter: ProductFilter = {};

    if (req.query.category) {
      filter.category = req.query.category as string;
    }
    if (req.query.minPrice) {
      filter.minPrice = Number(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      filter.maxPrice = Number(req.query.maxPrice);
    }
    if (req.query.inStock !== undefined) {
      filter.inStock = req.query.inStock === 'true';
    }
    if (req.query.searchTerm) {
      filter.searchTerm = req.query.searchTerm as string;
    }

    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 12;
    const result = productsService.getAllProducts(filter, page, pageSize);

    const response: ApiResponse<PaginatedResponse<Product>> = {
      data: result,
      success: true,
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const product = productsService.getProductById(req.params.id);

    if (!product) {
      const response: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Product not found',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<Product> = {
      data: product,
      success: true,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

app.get('/api/products-metadata/categories', (_req, res) => {
  try {
    const categories = productsService.getCategories();
    const response: ApiResponse<string[]> = {
      data: categories,
      success: true,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

app.get('/api/products-metadata/price-range', (_req, res) => {
  try {
    const priceRange = productsService.getPriceRange();
    const response: ApiResponse<{ min: number; max: number }> = {
      data: priceRange,
      success: true,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});
