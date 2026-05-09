import express from 'express';
import { bookingsRouter } from '../modules/bookings/booking.routes';
import { vehiclesRouter } from '../modules/vehicles/vehicle.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { paymentRouter } from '../modules/payment/payment.routes';

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

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   GET  /api/bookings - Booking management`);
  console.log(`   GET  /api/vehicles - Vehicle management`);
  console.log(`   GET  /api/auth - Authentication`);
  console.log(`   GET  /api/payments - Payment processing`);
  console.log(`   GET  / - Health check`);
});
