# 🚀 Chalak Mobility Deployment Guide

## 📋 Prerequisites

1. **MongoDB Atlas Account**
   - Create a free MongoDB Atlas account
   - Set up a cluster (M0 or higher)
   - Get connection string

2. **Domain Name**
   - Purchase a domain (e.g., chalak-mobility.com)
   - Configure DNS settings

3. **Deployment Platform**
   - Render (Recommended) - For Node.js API
   - Vercel/Netlify - For Angular frontend
   - Firebase Hosting - Alternative for frontend

## 🗃️ Database Setup

### MongoDB Atlas Configuration

1. **Create Cluster**
   ```bash
   # Login to MongoDB Atlas
   # Create new cluster (M0 free tier is sufficient for start)
   # Get connection string
   ```

2. **Configure Network Access**
   - Add IP: 0.0.0.0/0 (for cloud deployment)
   - Enable access from your deployment platform

3. **Create Database User**
   - Username: `chalak-api`
   - Password: Generate strong password
   - Permissions: Read/Write on `chalak-mobility` database

## 🔧 Environment Configuration

### Production Environment Variables

Create `.env.production` file with:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://chalak-api:PASSWORD@cluster.mongodb.net/chalak-mobility?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key-256-bits-long
API_BASE_URL=https://api.chalak-mobility.com
PORT=3000
ALLOWED_ORIGINS=https://chalak-mobility.com,https://www.chalak-mobility.com
```

### Frontend Environment

Update `apps/shop/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.chalak-mobility.com',
  firebase: {
    apiKey: 'your-firebase-api-key',
    // ... other firebase config
  }
};
```

## 🏗️ Build Process

### API Build
```bash
# Build API for production
npm run build:api

# Or using Nx
nx build api
```

### Frontend Build
```bash
# Build Angular app for production
npm run build:shop

# Or using Nx
nx build shop --configuration=production
```

## 🌐 Deployment Options

### Option 1: Render (Recommended)

#### API Deployment
1. **Create Render Account**
2. **Connect GitHub Repository**
3. **Create Web Service**
   - Name: `chalak-api`
   - Runtime: `Node`
   - Build Command: `npm run build:api`
   - Start Command: `node dist/apps/api/server/main.js`
   - Environment Variables: Add all from `.env.production`

#### Frontend Deployment
1. **Create Static Site**
   - Name: `chalak-web`
   - Build Command: `npm run build:shop`
   - Publish Directory: `dist/apps/shop/browser`
   - Add custom domain

### Option 2: Vercel + Render

#### Frontend on Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### API on Render
Same as Option 1 API deployment

### Option 3: Firebase Hosting

#### Frontend on Firebase
```bash
# Install Firebase CLI
npm i -g firebase-tools

# Initialize Firebase
firebase init hosting

# Deploy
firebase deploy --only hosting
```

## 🔒 Security Configuration

### SSL/TLS
- All platforms provide free SSL certificates
- Ensure HTTPS is enforced

### Environment Variables
- Never commit `.env` files
- Use platform's environment variable management
- Rotate secrets regularly

### API Security
- Rate limiting implemented
- CORS configured for your domain
- JWT tokens with proper expiration

## 📱 PWA Features

The application includes:

- ✅ Service Worker for offline support
- ✅ Web App Manifest
- ✅ App Icons (multiple sizes)
- ✅ Splash Screens
- ✅ Push Notification Ready

## 🧪 Pre-Deployment Checklist

### API Tests
```bash
# Test API locally
npm run serve:api

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/auth/register
```

### Frontend Tests
```bash
# Test frontend locally
npm run serve:shop

# Build test
npm run build:shop
```

### Integration Tests
- Test complete auth flow
- Test multilingual functionality
- Test PWA installation
- Test responsive design

## 📊 Monitoring & Analytics

### Recommended Setup
- **Sentry** - Error tracking
- **Google Analytics** - User analytics
- **Uptime Robot** - Service monitoring
- **MongoDB Atlas** - Database monitoring

## 🚀 Deployment Commands

### Complete Deployment
```bash
# 1. Build everything
npm run build

# 2. Deploy API (Render via GitHub auto-deploy)
git push origin main

# 3. Deploy Frontend
npm run deploy:shop

# 4. Verify deployment
curl https://api.chalak-mobility.com/health
open https://chalak-mobility.com
```

## 🔧 Post-Deployment

### DNS Configuration
- Point `chalak-mobility.com` to frontend
- Point `api.chalak-mobility.com` to API
- Configure subdomains as needed

### Performance Optimization
- Enable CDN (Vercel/Render provide this)
- Configure caching headers
- Monitor Core Web Vitals

### Backup Strategy
- MongoDB Atlas automated backups
- Code repository (GitHub)
- Environment variables backup

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check connection string
   - Verify IP whitelist
   - Check network access

2. **CORS Errors**
   - Verify allowed origins
   - Check API endpoint URLs
   - Ensure HTTPS in production

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies installed
   - Check environment variables

4. **PWA Not Installing**
   - Verify manifest.json is accessible
   - Check service worker registration
   - Ensure HTTPS (required for PWA)

## 📞 Support

For deployment issues:
- Check platform documentation
- Review error logs
- Test in staging environment first

---

**🎉 Your Chalak Mobility application is now ready for production deployment!**
