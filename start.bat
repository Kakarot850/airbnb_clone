@echo off
rem Starts the backend (FastAPI) and the frontend (Next.js) together on Windows.
rem   start.bat           install what's missing, then run both servers
rem   start.bat --reset   same, but wipe the database and reload the demo data first
rem Press Ctrl+C to stop both servers. The real work happens in start.ps1.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
