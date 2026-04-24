@echo off
cd /d "%~dp0"
git config --global user.email "kowshikkharvi18@gmail.com"
git config --global user.name "kowshikkharvi18-lgtm"
if exist ".git" rmdir /s /q .git
git init
git add .
git commit -m "BeRich app upload"
git branch -M main
git remote add origin https://github.com/kowshikkharvi18-lgtm/Berich-app1.git
git push -u origin main --force
echo.
echo ============================================
echo   SUCCESS! Files uploaded to GitHub!
echo ============================================
echo.
echo Next: Go to render.com to deploy
pause
