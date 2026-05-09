# Chalak Mobility - Codebase Analysis

## 📊 Project Overview

This is a **production-ready Angular monorepo** built with **Nx** that demonstrates a complete e-commerce platform with a backend API and frontend shop application. The project follows modern software architecture principles with clear separation of concerns, library boundaries, and feature-based structure.

**Tech Stack:**
- **Frontend:** Angular 21.2.9 (with SSR support)
- **Backend:** Node.js with Express 4.21.2
- **Build Tool:** Nx 22.7.0
- **Testing:** Vitest with Playwright for E2E
- **Package Manager:** PNPM
- **Styling:** CSS (CSS-in-component approach)

---

## 🏗️ Workspace Architecture

### Project Structure

```
chalak-mobility/
├── apps/
│   ├── api/                    # Express backend API
│   ├── shop/                   # Angular SSR e-commerce frontend
│   └── shop-e2e/              # Playwright E2E tests
├── libs/
│   ├── api/
│   │   └── products/          # API product service library
│   ├── shared/
│   │   └── models/            # Shared TypeScript models/interfaces
│   └── shop/
│       ├── data/              # Data access layer (services)
│       ├── feature-product-detail/  # Product detail feature
│       ├── feature-products/  # Product listing feature
│       └── shared-ui/         # Reusable UI components
├── nx.json                    # Nx configuration
├── package.json              # Dependencies
├── tsconfig.base.json        # Base TypeScript configuration
└── eslint.config.mjs         # ESLint configuration
```

### Module Boundaries & Tagging Strategy

The workspace uses **Nx's module boundary enforcement** with tags to maintain clean architecture:

**Scope Tags:**
- `scope:shared` - Shared libraries (models, shared-ui) - can be used by all projects
- `scope:shop` - Shop-specific libraries (data, features)
- `scope:api` - API-specific libraries (products service)

**Type Tags:**
- `type:feature` - Feature modules (feature-products, feature-product-detail)
- `type:data` - Data access layers (data, api products)
- `type:ui` - UI component libraries (shared-ui)

**Dependency Rules:**
```
feature → data → models ✓ (allowed)
shop → api ✗ (blocked)
api → shop ✗ (blocked)
```

---

## 📱 Applications

### 1. **API Application** (`apps/api/`)

**Purpose:** RESTful backend serving product data

**Key Features:**
- Express.js server with CORS support
- RESTful endpoints for product management
- Mock data generation with 50+ sample products
- Pagination and filtering capabilities
- Docker support with automated build targets

**Main Endpoints:**
```
GET  /                    # Health check
GET  /api/products        # List all products (with filtering)
GET  /api/products/:id    # Get product by ID
```

**Query Parameters for Filtering:**
- `category` - Filter by category (Electronics, Clothing, Books, etc.)
- `minPrice` / `maxPrice` - Price range filtering
- `inStock` - Filter by stock status (true/false)
- `searchTerm` - Full-text search across name, description, category
- `page` - Pagination (default: 1)
- `pageSize` - Items per page (default: 12)

**Configuration:**
- Default Host: `localhost`
- Default Port: `3333` (customizable via `PORT` env var)
- Build Tool: esbuild
- Output: `apps/api/dist/`

---

### 2. **Shop Application** (`apps/shop/`)

**Purpose:** Angular SSR e-commerce frontend

**Key Features:**
- Server-Side Rendering (SSR) with Angular Universal
- Responsive design with CSS
- Feature-based module organization
- Product listing and detail views
- RxJS-based state management through services
- Navigation flow optimized for user experience

**Architecture:**
```
apps/shop/src/
├── main.ts               # Browser entry point
├── main.server.ts        # Server-side entry point
├── server.ts            # Express server for SSR
├── styles.css           # Global styles
└── app/
    ├── app.ts           # Root component
    ├── app.html         # Root template
    ├── app.routes.ts    # Routing configuration
    └── features/        # Feature modules
        ├── home/        # Home page with sections
        ├── hero/        # Hero section
        ├── business/    # Business-related features
        ├── how-it-works/# Instructions/guidelines
        ├── pricing/     # Pricing display
        ├── vehicles/    # Vehicle listing
        └── why-choose/  # Marketing section
```

**Key Configuration:**
- **Build Target:** @angular/build:application
- **Output:** `dist/apps/shop/`
- **Features:**
  - SSR enabled with custom server entry
  - Proxy configuration for API requests (`proxy.conf.json`)
  - Global styles applied to all components
  - Component-scoped styles

---

### 3. **E2E Test Suite** (`apps/shop-e2e/`)

**Purpose:** End-to-end testing with Playwright

**Test Coverage:**
```
src/
├── shop-homepage.spec.ts    # Homepage navigation & rendering
├── navigation-flow.spec.ts   # User navigation flows
├── product-listing.spec.ts   # Product listing page functionality
└── product-detail.spec.ts    # Product detail page interactions
```

**Features:**
- Browser automation with Playwright
- Cross-browser testing support
- Atomic task execution (parallelized CI runs)
- HTML report generation
- Blob report merging for CI/CD pipelines

---

## 🧩 Libraries

### **Shared Libraries**

#### 1. **@org/models** (`libs/shared/models/`)
**Type:** Data Models | **Scope:** `scope:shared` | **Type Tags:** `type:data`

**Purpose:** Centralized TypeScript models shared across API and Shop

**Exports:**
```typescript
// Product model
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
}

// API response wrapper
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Paginated response
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Product filtering
interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  searchTerm?: string;
}
```

---

#### 2. **@org/shared-ui** (`libs/shop/shared-ui/`)
**Type:** UI Component Library | **Scope:** `scope:shop` | **Type Tags:** `type:ui`

**Purpose:** Reusable Angular components used across shop features

**Components:**
```
src/lib/
├── product-card/          # Individual product display component
├── product-grid/          # Grid layout container for products
├── loading-spinner/       # Loading indicator component
└── error-message/         # Error notification component
```

**Characteristics:**
- Standalone Angular components
- CSS module scoped styling
- Focused on presentation layer
- Reusable across features

---

### **API Libraries**

#### 3. **@org/api/products** (`libs/api/products/`)
**Type:** Service Library | **Scope:** `scope:api` | **Type Tags:** `type:data`

**Purpose:** Backend product service with mock data and filtering logic

**Main Class:** `ProductsService`

**Key Methods:**
```typescript
getAllProducts(
  filter?: ProductFilter,
  page?: number,
  pageSize?: number
): PaginatedResponse<Product>

getProductById(id: string): Product | undefined

getCategories(): string[]

getTrendingProducts(limit?: number): Product[]
```

**Features:**
- In-memory product database with 50 mock products
- Advanced filtering (price range, category, stock status, search)
- Pagination support
- Mock data generation with random attributes
- Performance-optimized queries

**Mock Data Characteristics:**
- 50 products across 5 categories: Electronics, Clothing, Books, Home & Garden, Sports
- Random pricing ($10-$510)
- 80% stock availability
- Ratings: 3-5 stars
- Variable review counts (0-500)

---

### **Shop Libraries**

#### 4. **@org/shop/data** (`libs/shop/data/`)
**Type:** Data Access Layer | **Scope:** `scope:shop` | **Type Tags:** `type:data`

**Purpose:** Angular services for fetching and managing shop data

**Structure:**
```
src/lib/services/
├── products.service.ts      # HTTP service for product API calls
└── products.service.spec.ts # Service tests
```

**Service Methods:**
```typescript
getAllProducts(
  filter?: ProductFilter,
  page?: number,
  pageSize?: number
): Observable<PaginatedResponse<Product>>

getProductById(id: string): Observable<Product>
```

**Characteristics:**
- HTTP-based communication with API
- Observable-based async handling
- Error handling and retry logic
- Caching optimizations

---

#### 5. **@org/shop/feature-products** (`libs/shop/feature-products/`)
**Type:** Feature Module | **Scope:** `scope:shop` | **Type Tags:** `type:feature`

**Purpose:** Product listing feature module with filtering and grid display

**Dependencies:**
- `@org/shop/data` - For data access
- `@org/shared-ui` - For UI components
- `@org/models` - For data models
- Angular: router, forms, common

**Key Responsibilities:**
- Product list page rendering
- Filtering interface and logic
- Pagination handling
- State management for filters

**Expected Components/Routes:**
- Products list view
- Filter sidebar/controls
- Sorted/paginated display

---

#### 6. **@org/shop/feature-product-detail** (`libs/shop/feature-product-detail/`)
**Type:** Feature Module | **Scope:** `scope:shop` | **Type Tags:** `type:feature`

**Purpose:** Individual product detail view with metadata and reviews

**Dependencies:**
- `@org/shop/data` - For product fetching
- `@org/shared-ui` - For UI components
- `@org/models` - For data models
- Angular: router

**Key Responsibilities:**
- Single product detail display
- Product metadata rendering
- Related/recommended products (if any)
- User interaction handling

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Browser (Client)                        │
│                    Shop App                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Feature Components                               │  │
│  │ ├── Product List (feature-products)             │  │
│  │ └── Product Detail (feature-product-detail)     │  │
│  └───────────────┬──────────────────────────────────┘  │
│                  │                                       │
│                  ↓                                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Shared UI (@org/shared-ui)                       │  │
│  │ ├── product-card                                │  │
│  │ ├── product-grid                                │  │
│  │ ├── loading-spinner                             │  │
│  │ └── error-message                               │  │
│  └───────────────┬──────────────────────────────────┘  │
│                  │                                       │
│                  ↓                                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Data Access Layer (@org/shop/data)              │  │
│  │ └── products.service (HTTP calls)               │  │
│  └───────────────┬──────────────────────────────────┘  │
└──────────────────┼──────────────────────────────────────┘
                   │ HTTP/REST (port 3333)
                   ↓
┌─────────────────────────────────────────────────────────┐
│         Server-Side API (Backend)                        │
│         Express Application (api app)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ API Routes                                       │  │
│  │ ├── GET /api/products                           │  │
│  │ └── GET /api/products/:id                       │  │
│  └───────────────┬──────────────────────────────────┘  │
│                  │                                       │
│                  ↓                                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ProductsService (@org/api/products)             │  │
│  │ ├── getAllProducts()                            │  │
│  │ ├── getProductById()                            │  │
│  │ └── Mock Data (50 products in memory)           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 📦 Dependencies Graph

**Allowed Dependencies:**
```
feature-products
  ├→ @org/shop/data
  ├→ @org/shared-ui
  ├→ @org/models
  └→ Angular libraries

feature-product-detail
  ├→ @org/shop/data
  ├→ @org/shared-ui
  ├→ @org/models
  └→ Angular libraries

@org/shop/data
  ├→ @org/models
  └→ Angular libraries

@org/shared-ui
  ├→ @org/models
  └→ Angular libraries

api (Express app)
  ├→ @org/api/products
  └→ @org/models

@org/api/products
  └→ @org/models
```

---

## 🔨 Build & Development Targets

### Nx Targets Available

**For each project:**

#### Build Targets:
```bash
nx build <project>              # Production build
nx build <project> --dev        # Development build
```

#### Development:
```bash
nx serve shop                   # Serve shop with SSR
nx serve api                    # Serve API server
```

#### Testing:
```bash
nx test <project>              # Unit tests (Vitest)
nx e2e shop-e2e               # E2E tests (Playwright)
```

#### Code Quality:
```bash
nx lint <project>              # ESLint check
nx typecheck <project>         # TypeScript validation
```

#### Batch Operations:
```bash
nx run-many -t build           # Build all projects
nx run-many -t test            # Test all projects
nx run-many -t lint            # Lint all projects
nx affected -t build           # Build affected projects only
```

---

## 🐳 Docker Support

The API application includes Docker support:

```bash
# Build Docker image
nx docker:build api

# Run Docker container
nx docker:run api --args="-p 3333:3333"

# With release management
nx nx-release-publish api
```

**Dockerfile Features:**
- Multi-stage build
- Node.js runtime
- Optimized image size
- Health check configured

---

## 🧪 Testing Strategy

### Unit Tests
- **Framework:** Vitest
- **Location:** `*.spec.ts` files in each library/app
- **Coverage:** Services, utilities, helpers
- **Plugins:** @analogjs/vitest-angular for Angular components

### E2E Tests
- **Framework:** Playwright
- **Location:** `apps/shop-e2e/src/`
- **Coverage:**
  - Homepage navigation
  - Product listing flows
  - Product detail views
  - User interactions
- **CI/CD Features:**
  - Atomic test runs (parallelized)
  - HTML report generation
  - Blob report merging

---

## 🎯 Key Design Patterns

### 1. **Feature-Based Architecture**
- Features are organized in `libs/shop/feature-*`
- Each feature is self-contained with its own routing
- Features depend on shared data layer, not each other

### 2. **Layered Architecture**
```
Presentation (Features/Pages)
    ↓
UI Components (shared-ui)
    ↓
Data Access Layer (data services)
    ↓
API Models (shared models)
    ↓
Backend Service
```

### 3. **Reactive Programming**
- RxJS Observables for async operations
- Angular services manage data streams
- Proper subscription handling

### 4. **Dependency Injection**
- Angular DI container for services
- Constructor injection pattern
- Loose coupling between layers

### 5. **Type Safety**
- Full TypeScript implementation
- Shared interfaces across API/Frontend
- Strong typing prevents runtime errors

---

## 📊 Code Statistics

| Category | Count | Details |
|----------|-------|---------|
| **Applications** | 3 | shop, api, shop-e2e |
| **Libraries** | 6 | models, products (api), data, product-card, product-grid, error/loading (ui) |
| **Mock Products** | 50 | 5 categories, random attributes |
| **E2E Tests** | 4 | Homepage, navigation, product listing, product detail |
| **Scope Tags** | 3 | shared, shop, api |
| **Type Tags** | 3 | feature, data, ui |

---

## 🚀 Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Serve both frontend and backend
npm run nx serve shop    # Auto-starts API on port 3333

# OR serve separately
npm run nx serve api     # Port 3333
npm run nx serve shop    # Port 4200
```

### Development Loop
1. **Feature Development** → Modify feature library in `libs/shop/feature-*`
2. **UI Components** → Update components in `libs/shop/shared-ui`
3. **Data Models** → Update types in `libs/shared/models`
4. **Testing** → Run `nx test <project>`
5. **Linting** → Run `nx lint <project>`
6. **Building** → Run `nx build <project>`

### CI/CD Pipeline (Suggested)
1. **Lint:** `nx run-many -t lint`
2. **Type Check:** `nx run-many -t typecheck`
3. **Test:** `nx run-many -t test`
4. **Build:** `nx run-many -t build`
5. **E2E:** `nx e2e shop-e2e`

---

## 🎨 Styling Strategy

- **Global Styles:** `apps/shop/src/styles.css`
- **Component Styles:** Scoped CSS in component directories (e.g., `booking.css`)
- **CSS Variables:** Primary green color (`--primary-green`)
- **Responsive Design:** CSS media queries and flexbox

### Example CSS Usage
```css
.booking h2 {
  text-align: center;
  margin-bottom: 30px;
}

.steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.steps span.active {
  border-color: var(--primary-green);
  color: var(--primary-green);
}
```

---

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `nx.json` | Nx workspace configuration, caching, plugins |
| `package.json` | Dependencies, scripts, workspace metadata |
| `tsconfig.base.json` | Base TypeScript configuration, path mappings |
| `eslint.config.mjs` | ESLint rules and configurations |
| `vitest.workspace.ts` | Vitest test configuration |
| `apps/shop/proxy.conf.json` | API proxy config for dev server |
| `apps/api/Dockerfile` | Docker image definition |

---

## 🎯 Current Features & Status

✅ **Implemented:**
- Multi-layered architecture with clear boundaries
- Product listing with filtering & pagination
- Product detail views
- Mock data generation
- API with RESTful endpoints
- E2E test coverage
- Docker support for API
- Type-safe shared models
- SSR support for shop

🔄 **In Development:**
- Booking feature (evidenced by booking.css file)
- Advanced product features

📋 **Future Enhancements:**
- User authentication/authorization
- Shopping cart functionality
- Order management
- Payment integration
- User reviews and ratings
- Admin dashboard
- Real database (replace mock data)

---

## 🔍 Notable Files

| Path | Purpose |
|------|---------|
| `apps/shop/src/app/features/home/booking/booking.css` | Booking feature styling with step indicators |
| `apps/api/src/main.ts` | Express server setup with CORS |
| `libs/api/products/src/lib/products.service.ts` | Mock product data and filtering logic |
| `libs/shared/models/src/lib/product.model.ts` | Central data model definitions |
| `apps/shop-e2e/src/shop-homepage.spec.ts` | Homepage E2E tests |

---

## 📚 Monorepo Benefits Demonstrated

1. **Code Reuse:** Shared models, UI components, services
2. **Atomic Releases:** Libraries can be versioned independently
3. **Type Safety:** Shared TypeScript interfaces prevent API/UI mismatches
4. **Scalability:** Easy to add new features/libraries
5. **Testing:** Integrated test coverage across full stack
6. **Performance:** Nx caching and affected builds optimize CI/CD
7. **Modularity:** Clear dependency boundaries via tags
8. **DX:** Single workspace, unified tooling

---

## 🎓 Learning Path

If you're new to this codebase:

1. **Start:** Read this document (you're here ✓)
2. **Explore:** Run `nx graph` to visualize the project structure
3. **API:** Study `libs/api/products/src/lib/products.service.ts`
4. **Models:** Review `libs/shared/models/src/lib/product.model.ts`
5. **Features:** Examine `libs/shop/feature-products/src/`
6. **Components:** Check `libs/shop/shared-ui/src/lib/`
7. **Tests:** Review `apps/shop-e2e/src/`
8. **Run:** Execute `npm install && nx serve shop`

---

**Generated:** May 4, 2026
**Codebase Version:** chalak-mobility v0.0.0
**Nx Version:** 22.7.0
**Angular Version:** 21.2.9
