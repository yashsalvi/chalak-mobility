import express from 'express';

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
    status: 'healthy',
    endpoints: {
      health: '/',
      bookings: '/api/bookings',
      vehicles: '/api/vehicles',
      auth: '/api/auth',
      payments: '/api/payments'
    }
  });
});

// Test endpoints
app.get('/api/test', (_req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

app.get('/api/bookings/test', (_req, res) => {
  res.json({
    message: 'Bookings endpoint working',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

app.get('/api/vehicles/test', (_req, res) => {
  res.json({
    message: 'Vehicles endpoint working',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

app.get('/api/auth/test', (_req, res) => {
  res.json({
    message: 'Auth endpoint working',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

app.get('/api/payments/test', (_req, res) => {
  res.json({
    message: 'Payments endpoint working',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   GET  / - Health check`);
  console.log(`   GET  /api/test - Test endpoint`);
  console.log(`   GET  /api/bookings/test - Bookings test`);
  console.log(`   GET  /api/vehicles/test - Vehicles test`);
  console.log(`   GET  /api/auth/test - Auth test`);
  console.log(`   GET  /api/payments/test - Payments test`);
});
