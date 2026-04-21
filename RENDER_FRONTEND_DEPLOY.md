# 🚀 Deploy Frontend to Render - Complete Guide

## ✅ What's Been Prepared

Your frontend is now **production-ready** with:

- ✅ Optimized Vite build configuration
- ✅ Code splitting for faster loads
- ✅ SPA routing with `_redirects` file
- ✅ SEO meta tags and Open Graph tags
- ✅ Security headers configured
- ✅ Environment variable setup
- ✅ Production start script

---

## 📋 Deployment Options

### Option 1: Deploy as Static Site (Recommended - FREE)

**Pros:**
- ✅ Completely FREE on Render
- ✅ Fast CDN delivery
- ✅ Auto SSL certificate
- ✅ Simple deployment

**Steps:**

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare frontend for Render deployment"
   git push origin main
   ```

2. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Click "New +" → "Static Site"

3. **Connect Repository**
   - Connect your GitHub account
   - Select your `ai-applyer` repository
   - Click "Connect"

4. **Configure Build Settings**
   ```
   Name: career-os-frontend
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

5. **Add Environment Variables**
   Click "Advanced" → Add Environment Variables:
   ```
   VITE_API_URL = https://career-os-9t8n.onrender.com
   VITE_GOOGLE_CLIENT_ID = your_google_client_id_here
   ```

6. **Deploy!**
   - Click "Create Static Site"
   - Wait 2-3 minutes for build
   - Your site will be live at: `https://career-os-frontend.onrender.com`

---

### Option 2: Deploy as Web Service (If you need server-side features)

**Note:** This uses a free tier but may spin down after inactivity.

**Steps:**

1. **Push to GitHub** (same as above)

2. **Go to Render Dashboard**
   - Click "New +" → "Web Service"

3. **Connect Repository**
   - Select your `ai-applyer` repository

4. **Configure Service**
   ```
   Name: career-os-frontend
   Region: Choose closest to you
   Branch: main
   Root Directory: frontend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

5. **Instance Type**
   - Select "Free" (or paid if you want always-on)

6. **Add Environment Variables**
   ```
   NODE_VERSION = 18
   VITE_API_URL = https://career-os-9t8n.onrender.com
   VITE_GOOGLE_CLIENT_ID = your_google_client_id_here
   ```

7. **Deploy!**
   - Click "Create Web Service"
   - Wait for deployment

---

## 🔧 Post-Deployment Configuration

### 1. Update Backend CORS

Add your frontend URL to backend's allowed origins:

**Backend `.env`:**
```env
FRONTEND_URL=https://your-frontend-url.onrender.com
```

**Or in Render backend environment variables:**
```
FRONTEND_URL = https://career-os-frontend.onrender.com
```

### 2. Update Google OAuth

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

**Add to Authorized JavaScript origins:**
```
https://your-frontend-url.onrender.com
```

**Add to Authorized redirect URIs:**
```
https://your-frontend-url.onrender.com
```

### 3. Test Your Deployment

Visit your frontend URL and test:
- ✅ Login with email/password
- ✅ Login with Google
- ✅ All pages load correctly
- ✅ API calls work
- ✅ Routing works (refresh on any page)

---

## 🎯 Custom Domain (Optional)

### Add Your Own Domain

1. **In Render Dashboard:**
   - Go to your static site/web service
   - Click "Settings" → "Custom Domain"
   - Click "Add Custom Domain"
   - Enter: `app.yourdomain.com`

2. **Update DNS Records:**
   Add CNAME record in your domain provider:
   ```
   Type: CNAME
   Name: app
   Value: your-site.onrender.com
   ```

3. **Update Environment Variables:**
   Update `VITE_API_URL` if needed

4. **Update Google OAuth:**
   Add your custom domain to authorized origins/redirects

---

## 🔄 Auto-Deploy on Git Push

Render automatically deploys when you push to your main branch!

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

Render will:
1. Detect the push
2. Run build command
3. Deploy new version
4. Update live site (2-3 minutes)

---

## 📊 Monitor Your Deployment

### In Render Dashboard:

- **Logs:** See build and runtime logs
- **Metrics:** View bandwidth and requests
- **Events:** Track deployments
- **Shell:** Access terminal (web service only)

---

## 🐛 Troubleshooting

### Build Fails

**Check:**
- Node version is 18+
- All dependencies in package.json
- Build command is correct
- Environment variables are set

**View logs:**
- Go to "Logs" tab in Render dashboard
- Look for error messages

### Blank Page After Deploy

**Check:**
1. Browser console for errors
2. API URL is correct in environment variables
3. Backend CORS allows your frontend URL
4. `_redirects` file exists in `public/` folder

### API Calls Fail

**Check:**
1. `VITE_API_URL` is set correctly
2. Backend is running
3. Backend CORS is configured
4. Network tab in browser DevTools

### Google Sign-In Not Working

**Check:**
1. `VITE_GOOGLE_CLIENT_ID` is set
2. Frontend URL is in Google Console authorized origins
3. Browser console for Google errors

---

## 💰 Pricing

### Static Site (Recommended)
- **FREE** ✅
- 100 GB bandwidth/month
- Global CDN
- Auto SSL
- Perfect for this app!

### Web Service Free Tier
- **FREE** but spins down after 15 min inactivity
- 750 hours/month
- Good for testing

### Web Service Paid
- $7/month for always-on
- More resources
- No spin-down

---

## 🎉 Quick Deploy Checklist

- [ ] Push code to GitHub
- [ ] Create Static Site on Render
- [ ] Set Root Directory: `frontend`
- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Publish Directory: `dist`
- [ ] Add `VITE_API_URL` environment variable
- [ ] Add `VITE_GOOGLE_CLIENT_ID` environment variable
- [ ] Click "Create Static Site"
- [ ] Wait for build to complete
- [ ] Update backend `FRONTEND_URL`
- [ ] Update Google OAuth authorized origins
- [ ] Test the deployment!

---

## 🔗 Useful Links

- **Render Dashboard:** https://dashboard.render.com/
- **Render Docs:** https://render.com/docs/static-sites
- **Google Console:** https://console.cloud.google.com/
- **Your Backend:** https://career-os-9t8n.onrender.com

---

## 📝 Environment Variables Summary

**Required:**
```env
VITE_API_URL=https://career-os-9t8n.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Optional:**
```env
NODE_VERSION=18
```

---

## ✨ After Deployment

Your Career OS AI will be live at:
```
https://career-os-frontend.onrender.com
```

Or your custom domain:
```
https://app.yourdomain.com
```

**Share it with the world! 🚀**

---

Need help? Just ask! I can guide you through any step.
