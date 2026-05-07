# Lucide Icons Setup & Usage Guide

## Global Configuration

**File**: `apps/shop/src/app/app.config.ts`

All Lucide icons are configured globally via `importProvidersFrom(LucideAngularModule)`. This provides **ALL** Lucide icons throughout the entire application without needing individual component imports.

```typescript
import { LucideAngularModule } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    importProvidersFrom(LucideAngularModule)  // ✅ Provides all icons globally
  ],
};
```

## Components Using Lucide Icons

All components automatically have access to Lucide icons through the global configuration:

### Header Component
- **File**: `apps/shop/src/app/layout/header/header.ts`
- **Icons Used**: `house`, `car`, `layout-list`, `briefcase`
- **Imports**: `LucideAngularModule` removed (provided globally)

### Booking Component
- **File**: `apps/shop/src/app/features/home/booking/booking.ts`
- **Icons Used**: `alert-triangle`
- **Imports**: `LucideAngularModule` removed (provided globally)

### Booking Vehicle Component
- **File**: `apps/shop/src/app/features/home/booking/booking-vehicle/booking-vehicle.ts`
- **Icons Used**: `check`

### Booking Plan Component
- **File**: `apps/shop/src/app/features/home/booking/booking-plan/booking-plan.ts`
- **Icons Used**: `check`

### Booking Payment Component
- **File**: `apps/shop/src/app/features/home/booking/booking-payment/booking-payment.ts`
- **Icons Used**: `check`

### Booking Success Component
- **File**: `apps/shop/src/app/features/home/booking/booking-success/booking-success.ts`
- **Icons Used**: `alert-triangle`, `check`, `download`, `refresh-cw`, `list`

### Why Choose Component
- **File**: `apps/shop/src/app/features/why-choose/why-choose.ts`
- **Icons Used**: `wallet`, `zap`, `wrench`, `smartphone`

### How It Works Component
- **File**: `apps/shop/src/app/features/how-it-works/how-it-works.ts`
- **Icons Used**: `calendar-check`, `map-pin`, `trending-up`

### Business Component
- **File**: `apps/shop/src/app/features/business/business.ts`
- **Icons Used**: `truck`, `trending-up`, `shield-check`

## Complete Icon List Used in Application

- `alert-triangle` - Warning/error indicators
- `briefcase` - Business section
- `calendar-check` - Booking/scheduling
- `car` - Vehicles navigation
- `check` - Checkmarks, selected indicators, success
- `download` - Receipt download
- `house` - Home navigation
- `layout-list` - Plans/list navigation
- `list` - View bookings
- `map-pin` - Location/pickup
- `refresh-cw` - Refresh/reload status
- `shield-check` - Security/verified
- `smartphone` - Mobile/phone
- `trending-up` - Profits/earnings
- `truck` - Fleet/business vehicles
- `wallet` - Payment/cost
- `wrench` - Maintenance/repair
- `zap` - Fast/energy

## How to Add New Icons

1. Use any Lucide icon in your template:
   ```html
   <lucide-icon name="your-icon-name" size="18"></lucide-icon>
   ```

2. The icon will automatically be available through the global `LucideAngularModule` configuration

3. No component-level imports needed!

## Troubleshooting

### Icon Not Appearing Error: "X icon has not been provided by any available icon providers"

**Cause**: This error occurs when components try to use `LucideAngularModule.pick()` locally, which conflicts with the global configuration.

**Solution**: 
- Remove `LucideAngularModule` from component imports arrays
- Keep only the global configuration in `app.config.ts`
- The component will automatically have access to all icons

## Best Practices

✅ **Do**:
- Use icons from the global configuration
- Keep icons consistent with the Lucide Angular library
- Use semantic icon names (e.g., `check` for success, `alert-triangle` for warnings)

❌ **Don't**:
- Import `LucideAngularModule` in individual components
- Use custom `.pick()` configurations in components
- Use emoji icons if Lucide alternatives exist
