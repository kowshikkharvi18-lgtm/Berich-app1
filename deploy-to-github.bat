@echo off
title BeRich - Upload to GitHub
color 0A
cd /d "%~dp0"

echo.
echo  ============================================
echo    BeRich - Upload to GitHub
echo  ============================================
echo.

:: Check Git installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  Git is NOT installed!
    echo  Install from: https://git-scm.com/download/win
    echo  Then restart PC and run this file again.
    pause
    exit
)

echo  Git found OK
echo.

:: Check if already setup
if exist ".git" (
    echo  Git already setup - just pushing latest changes...
    git add .
    git commit -m "Update BeRich app"
    git push
    if %errorlevel% equ 0 (
        color 0A
        echo.
        echo  Done! GitHub is updated.
        echo  Go to Render and click Manual Deploy.
    ) else (
        color 0C
        echo.
        echo  Push failed. Try running as first time setup below.
    )
    pause
    exit
)

:: First time setup
set /p GITHUB_USER="  Type your GitHub username: "
set /p GITHUB_EMAIL="  Type your GitHub email: "
set /p REPO_URL="  Paste your GitHub repo URL (.git link): "

git config --global user.name "%GITHUB_USER%"
git config --global user.email "%GITHUB_EMAIL%"
git config --global credential.helper manager

git init
git add .
git commit -m "BeRich app - first upload"
git branch -M main
git remote add origin %REPO_URL%

echo.
echo  Uploading... (browser may open to login to GitHub)
echo.
git push -u origin main

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo  ============================================
    echo    SUCCESS! All files on GitHub!
    echo  ============================================
    echo.
    echo  Now go to render.com to deploy live.
) else (
    color 0C
    echo.
    echo  Failed. Check your URL and try again.
)

pause
