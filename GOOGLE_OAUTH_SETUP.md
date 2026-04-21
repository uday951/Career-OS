# Google OAuth Setup Guide

## 🔐 Setting Up Google Sign-In

Follow these steps to enable Google OAuth authentication in Career OS AI:

---

## Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name: `Career OS AI` (or your preferred name)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "External" (unless you have Google Workspace)
   - Click "Create"
   - Fill in required fields:
     - App name: `Career OS AI`
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Skip "Scopes" (click "Save and Continue")
   - Add test users if needed (your email)
   - Click "Save and Continue"

5. **Create OAuth 2.0 Client ID**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `Career OS AI Web Client`
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   http://localhost:3000
   https://your-production-frontend-url.com
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:5173
   http://localhost:3000
   https://your-production-frontend-url.com
   ```
   
   - Click "Create"
   - **Copy the Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)

---

## Step 2: Configure Frontend

1. **Update `.env` file** in `frontend/` directory:
   ```env
   VITE_API_URL=https://career-os-9t8n.onrender.com
   VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
   ```

2. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Restart the dev server:**
   ```bash
   npm run dev
   ```

---

## Step 3: Configure Backend

1. **Update `.env` file** in `backend/` directory:
   ```env
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com
   ```
   ⚠️ **Use the SAME Client ID as frontend**

2. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Restart the server:**
   ```bash
   npm run dev
   ```

---

## Step 4: Deploy to Production

### Frontend (Vercel/Netlify/etc.)
Add environment variable:
- `VITE_GOOGLE_CLIENT_ID` = Your Google Client ID

### Backend (Render)
Add environment variable:
- `GOOGLE_CLIENT_ID` = Your Google Client ID

### Update Google Console
Add your production URLs to:
- Authorized JavaScript origins
- Authorized redirect URIs

---

## 🧪 Testing

1. Go to your login page
2. Click "Sign in with Google"
3. Select your Google account
4. Grant permissions
5. You should be logged in automatically!

---

## 🔧 Troubleshooting

### "redirect_uri_mismatch" error
- Make sure your frontend URL is added to "Authorized redirect URIs" in Google Console
- Check that the URL matches exactly (including http/https and port)

### "idpiframe_initialization_failed" error
- Clear browser cookies
- Make sure you're not blocking third-party cookies
- Try in incognito mode

### "Invalid client" error
- Verify `GOOGLE_CLIENT_ID` is set correctly in both frontend and backend
- Make sure the Client ID matches exactly (no extra spaces)

### Google button not showing
- Check browser console for errors
- Verify `@react-oauth/google` is installed: `npm list @react-oauth/google`
- Make sure `VITE_GOOGLE_CLIENT_ID` is set in `.env`

---

## 📝 What You Need to Provide

**Just give me your Google Client ID and I'll help you configure it!**

To get it:
1. Follow Step 1 above
2. Copy the Client ID from Google Console
3. Paste it here

Example format:
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

---

## 🎯 How It Works

1. User clicks "Sign in with Google"
2. Google popup opens for authentication
3. User selects account and grants permission
4. Google returns a credential token
5. Frontend sends token to backend `/api/auth/google`
6. Backend verifies token with Google
7. Backend creates/finds user and returns JWT
8. User is logged in!

---

## 🔒 Security Notes

- Google tokens are verified server-side
- Users created via Google get a random password (not used)
- Email is used as the unique identifier
- If a user exists with the same email, they're logged in
- Google ID is stored for future reference

---

## ✅ Features

- ✅ One-click sign-in/sign-up
- ✅ No password required
- ✅ Secure token verification
- ✅ Automatic account creation
- ✅ Works with existing email accounts
- ✅ Beautiful Google-branded button
- ✅ Mobile responsive

---

Need help? Just provide your Google Client ID and I'll configure everything for you!
