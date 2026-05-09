# 🆓 Free Deployment Guide - Chalak Mobility

## 💰 Total Cost: $0/month

All services below have generous free tiers perfect for startups!

---

## 🗄️ MongoDB Atlas Setup (FREE)

### 1. Create Account
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
- Sign up with Google/GitHub (free)

### 2. Create Free Cluster
```
Cluster Tier: M0 (Free)
Cloud Provider: AWS
Region: Mumbai (closest to India)
Cluster Name: chalak-mobility
```

### 3. Get Connection String
```
Database: chalak-mobility
User: chalak-api
Password: Generate strong password
Connection: mongodb+srv://chalak-api:PASSWORD@cluster.mongodb.net/chalak-mobility
```

### 4. Network Access
- Add IP: 0.0.0.0/0 (allows all cloud services)
- Or add Render/Vercel IPs specifically

---

## 🚀 Render API Deployment (FREE)

### 1. Create Account
- Go to [Render](https://render.com)
- Sign up with GitHub (free)

### 2. Connect Repository
- Click "New" → "Web Service"
- Connect your GitHub repo
- Select `chalak-mobility` repository

### 3. Configure API Service
```
Name: chalak-api
Runtime: Node
Build Command: npm run build:api
Start Command: node dist/apps/api/server/main.js
Branch: main
Root Directory: ./
```

### 4. Environment Variables
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://chalak-api:PASSWORD@cluster.mongodb.net/chalak-mobility
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
PORT=3000
```

### 5. Deploy!
- Click "Create Web Service"
- Render will auto-build and deploy
- Your API URL: `https://chalak-api.onrender.com`

---

## 🌐 Vercel Frontend Deployment (FREE)

### 1. Create Account
- Go to [Vercel](https://vercel.com)
- Sign up with GitHub (free)

### 2. Connect Repository
- Click "Add New Project"
- Import GitHub repo
- Select `chalak-mobility` repository

### 3. Configure Frontend
```
Framework: Angular
Build Command: npm run build:shop
Output Directory: dist/apps/shop/browser
Install Command: npm install
```

### 4. Environment Variables
```
NEXT_PUBLIC_API_URL=https://chalak-api.onrender.com
```

### 5. Deploy!
- Click "Deploy"
- Your site URL: `https://chalak-mobility.vercel.app`

---

## 🔧 Update Frontend API URL

Update `apps/shop/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://chalak-api.onrender.com'
};
```

---

## 📱 Custom Domain (Optional - Paid)

### Free Subdomain Options:
- `your-app.vercel.app` (free)
- `your-app.onrender.com` (free)

### Paid Custom Domain:
- Purchase domain: ~$10/year
- Configure DNS: Free on both platforms

---

## 🧪 Test Everything

### 1. Test API
```bash
curl https://chalak-api.onrender.com/health
```

### 2. Test Frontend
- Visit `https://chalak-mobility.vercel.app`
- Test registration, login, booking flow

### 3. Test PWA
- Install as mobile app
- Test offline functionality

---

## 📊 Free Tier Limits

| Service | Free Tier | Your Usage | Status |
|----------|------------|------------|---------|
| MongoDB | 512MB | ~50MB | ✅ Plenty |
| Render | 750h/mo | ~24h/mo | ✅ Plenty |
| Vercel | Unlimited | ~100MB | ✅ Plenty |

---

## 🎉 You're Live!

Your Chalak Mobility app is now:
- ✅ **Live on the internet**
- ✅ **$0/month hosting**
- ✅ **SSL secured**
- ✅ **Globally distributed**
- ✅ **Mobile app ready**

---

## 📈 When to Upgrade

### MongoDB Atlas (M0 → M10)
- When you have >1000 users
- Need more storage
- Better performance

### Render (Free → Pro)
- When you need more uptime
- Better performance
- Priority support

### Vercel (Free → Pro)
- When you need analytics
- More bandwidth
- Team collaboration

---

## 🆘 Support

All platforms offer:
- Free documentation
- Community support
- GitHub integration
- Auto-deploys

---

**🎊 Congratulations! Your EV mobility platform is live and completely free!**
