@echo off
title MTV Platform - dev server
cd /d "%~dp0"

echo ============================================
echo   Mumbi Technology Ventures - Platform
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js is not installed.
  echo     Install the LTS version from https://nodejs.org  then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies ^(first run only, ~1-2 min^)...
  call npm install
  echo.
)

echo Starting the dev server...
echo Your browser will open at http://localhost:5173
echo Leave this window open while you use the app. Close it to stop.
echo.

timeout /t 3 >nul
start "" http://localhost:5173
call npm run dev
