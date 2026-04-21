# ⚡ Quick Deploy - Frontend to Render

## 🎯 5-Minute Deployment

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy frontend to Render"
git push origin main
```

### Step 2: Create Static Site on Render

**Go to:** https://dashboard.render.com/

**Click:** New + → Static Site

**Settings:**
```
Name:              career-os-frontend
Root Directory:    frontend
Build Command:     npm install && npm run build
Publish Directory: dist
```

**Environment Variables:**
```
VITE_API_URL              = https://career-os-9t8n.onrender.com
VITE_GOOGLE_CLIENT_ID     = your_google_client_id_here
```

**Click:** Create Static Site

### Step 3: Update Backend CORS

In Render backend environment variables, add:
```
FRONTEND_URL = https://career-os-frontend.onrender.com
```

### Step 4: Update Google OAuth

Add to Google Console authorized origins:
```
https://career-os-frontend.onrender.com
```

### Step 5: Test! 🎉

Visit: `https://career-os-frontend.onrender.com`

---

## 📋 Files Created for Deployment

✅ `vite.config.js` - Production build config
✅ `package.json` - Added start script
✅ `public/_redirects` - SPA routing
✅ `public/robots.txt` - SEO
✅ `index.html` - Meta tags added
✅ `render.yaml` - Render config (optional)

---

## 🔧 Build Commands Reference

**Local build test:**
```bash
cd frontend
npm run build
npm run preview
```

**Render will run:**
```bash
npm install && npm run build
```

---

## 🌐 Your URLs

**Backend API:**
```
https://career-os-9t8n.onrender.com
```

**Frontend (after deploy):**
```
https://career-os-frontend.onrender.com
```

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Static site created on Render
- [ ] Environment variables set
- [ ] Backend CORS updated
- [ ] Google OAuth updated
- [ ] Deployment successful
- [ ] Site tested and working

---

## 🆘 Quick Troubleshooting

**Build fails?**
→ Check Render logs tab

**Blank page?**
→ Check browser console + API URL

**API not working?**
→ Check backend CORS settings

**Google login fails?**
→ Check authorized origins in Google Console

---

## 💡 Pro Tips

1. **Free Tier:** Static sites are 100% FREE on Render
2. **Auto Deploy:** Push to GitHub = auto deploy
3. **Custom Domain:** Add in Render settings
4. **SSL:** Automatic and free
5. **CDN:** Global delivery included

---

## 📚 Full Guide

See `RENDER_FRONTEND_DEPLOY.md` for detailed instructions.

---

**Ready to deploy? Let's go! 🚀**
