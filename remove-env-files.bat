@echo off
echo.
echo ============================================
echo   REMOVING EXPOSED .env FILES FROM GIT
echo ============================================
echo.

REM Remove .env files from git cache
git rm --cached backend\.env
git rm --cached frontend\.env
git rm --cached backend\.env.new

REM Commit the removal
git commit -m "Remove exposed .env files from git"

echo.
echo ============================================
echo   FILES REMOVED FROM GIT TRACKING
echo ============================================
echo.
echo WARNING: Your secrets are still in git history!
echo.
echo URGENT ACTIONS REQUIRED:
echo.
echo 1. Change ALL passwords and API keys immediately:
echo    - MongoDB password: uday1234
echo    - JWT_SECRET
echo    - OPENROUTER_API_KEY
echo    - RAPIDAPI_KEY
echo.
echo 2. Update secrets in:
echo    - backend\.env (local)
echo    - Render environment variables (production)
echo.
echo 3. Consider using BFG Repo-Cleaner to remove from history:
echo    https://rtyley.github.io/bfg-repo-cleaner/
echo.
pause
