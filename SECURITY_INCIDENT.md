# 🚨 SECURITY INCIDENT: Exposed .env Files

## ⚠️ CRITICAL: Your secrets are exposed in git history!

Your `.env` files containing sensitive credentials were committed to git and are visible in your repository history.

---

## 🔥 IMMEDIATE ACTIONS REQUIRED

### 1. Remove Files from Git (Do This NOW)

**On Windows:**
```bash
cd d:\main_projects\ai-applyer
remove-env-files.bat
```

**On Mac/Linux:**
```bash
cd /path/to/ai-applyer
bash remove-env-files.sh
```

**Or manually:**
```bash
git rm --cached backend/.env
git rm --cached frontend/.env
git rm --cached backend/.env.new
git commit -m "Remove exposed .env files"
git push origin main
```

---

## 🔑 CHANGE ALL SECRETS IMMEDIATELY

### Exposed Credentials:

#### 1. MongoDB Password
**Current:** `uday1234`
**Action:** Change in MongoDB Atlas
- Go to: https://cloud.mongodb.com/
- Database Access → Edit User → Change Password
- Update connection string in Render

#### 2. JWT Secret
**Current:** `development_secret_key_12345`
**Action:** Generate new secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3. OpenRouter API Key
**Current:** `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`
**Action:** Revoke and create new key
- Go to: https://openrouter.ai/keys
- Delete old key
- Create new key

#### 4. RapidAPI Key
**Current:** `a6e19c4f18msh62f90a3601d56bap176b5djsn8fafda140f2e`
**Action:** Revoke and create new key
- Go to: https://rapidapi.com/developer/security
- Revoke old key
- Create new key

---

## 📝 Update Secrets Everywhere

### Local Development (backend/.env)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://udaydd6062_db_user:NEW_PASSWORD@cluster0.ey4rxkc.mongodb.net/careeros?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=NEW_GENERATED_SECRET_HERE
OPENROUTER_API_KEY=NEW_OPENROUTER_KEY_HERE
RAPIDAPI_KEY=NEW_RAPIDAPI_KEY_HERE
FRONTEND_URL=https://career-os-1-dhib.onrender.com
GOOGLE_CLIENT_ID=your_google_client_id
```

### Render Backend Environment Variables
Update all these in: https://dashboard.render.com/

```
MONGO_URI = mongodb+srv://udaydd6062_db_user:NEW_PASSWORD@...
JWT_SECRET = NEW_GENERATED_SECRET_HERE
OPENROUTER_API_KEY = NEW_OPENROUTER_KEY_HERE
RAPIDAPI_KEY = NEW_RAPIDAPI_KEY_HERE
GOOGLE_CLIENT_ID = your_google_client_id
FRONTEND_URL = https://career-os-1-dhib.onrender.com
```

### Render Frontend Environment Variables
```
VITE_API_URL = https://career-os-9t8n.onrender.com
VITE_GOOGLE_CLIENT_ID = your_google_client_id
```

---

## 🧹 Clean Git History (Optional but Recommended)

The secrets are still in git history. To completely remove them:

### Option 1: BFG Repo-Cleaner (Easiest)

1. **Download BFG:**
   - https://rtyley.github.io/bfg-repo-cleaner/

2. **Run:**
   ```bash
   java -jar bfg.jar --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

### Option 2: git filter-branch

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env frontend/.env backend/.env.new" \
  --prune-empty --tag-name-filter cat -- --all

git push --force --all
```

⚠️ **Warning:** Force pushing rewrites history. Coordinate with team if shared repo.

---

## ✅ Prevention Checklist

- [x] `.gitignore` includes `.env` files
- [ ] Removed `.env` from git tracking
- [ ] Changed MongoDB password
- [ ] Generated new JWT secret
- [ ] Revoked and created new OpenRouter key
- [ ] Revoked and created new RapidAPI key
- [ ] Updated local `.env` files
- [ ] Updated Render environment variables
- [ ] Tested application still works
- [ ] (Optional) Cleaned git history with BFG

---

## 🔒 Best Practices Going Forward

1. **Never commit `.env` files**
   - Always in `.gitignore`
   - Use `.env.example` for templates

2. **Use environment variables in production**
   - Render, Vercel, etc. have secure env var storage

3. **Rotate secrets regularly**
   - Every 90 days minimum

4. **Use different secrets for dev/prod**
   - Never use production secrets locally

5. **Enable 2FA everywhere**
   - MongoDB Atlas
   - GitHub
   - Render
   - API providers

---

## 📞 Need Help?

If you're unsure about any step, ask before proceeding. Security is critical!

---

## ⏱️ Timeline

**Immediate (Next 30 minutes):**
- Remove files from git
- Change MongoDB password
- Revoke API keys

**Within 24 hours:**
- Update all environment variables
- Test application
- Clean git history

**This week:**
- Enable 2FA on all services
- Review other security practices
