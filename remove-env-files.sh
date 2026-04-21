#!/bin/bash

# 🚨 URGENT: Remove Exposed .env Files from Git History

echo "🔒 Removing sensitive files from git history..."

# Remove .env files from git cache
git rm --cached backend/.env
git rm --cached frontend/.env
git rm --cached backend/.env.new

# Commit the removal
git commit -m "🔒 Remove exposed .env files from git"

echo ""
echo "✅ Files removed from git tracking"
echo ""
echo "⚠️  IMPORTANT: Your secrets are still in git history!"
echo ""
echo "🔄 To completely remove from history, you need to:"
echo "1. Change ALL passwords/API keys immediately"
echo "2. Use git filter-branch or BFG Repo-Cleaner"
echo ""
echo "🔑 Exposed Secrets to Change:"
echo "   - MongoDB password: uday1234"
echo "   - JWT_SECRET"
echo "   - OPENROUTER_API_KEY"
echo "   - RAPIDAPI_KEY"
echo ""
echo "📝 After changing secrets, update:"
echo "   - backend/.env (local)"
echo "   - Render environment variables (production)"
