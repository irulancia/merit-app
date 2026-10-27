@echo off
rem Double-click to start Merit on Windows: installs what it needs the first time, then builds, starts and opens it.
rem Close this window to stop Merit.
title Merit
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Merit needs Node.js, which isn't installed on this computer.
  echo Install it from https://nodejs.org (the LTS version^), then double-click this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Getting Merit ready the first time - this takes a minute or two...
  call npm install
  if errorlevel 1 (
    echo Merit could not be installed. Check your internet connection, then try again.
    pause
    exit /b 1
  )
)

echo Starting Merit...
set MERIT_OPEN_BROWSER=1
call npm start
pause
