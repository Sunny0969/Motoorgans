@echo off
title Motoorgans TMS Running...
cd /d "%~dp0"

:: Portable Node se backend chalana (Aapki main file agar app.js hai to vohi likhein)
start "" /min "%~dp0node-portable\node.exe" "%~dp0backend\app.js"

:: 3 second wait taake backend database se connect ho jaye
timeout /t 3 /nobreak >nul

:: Browser mein app automatic khul jayegi
start "" "http://localhost:3010"
exit