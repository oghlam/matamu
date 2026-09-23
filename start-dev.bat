@echo off
title Mat(a)Mu - Dev Server
color 0A

echo.
echo.
echo  Mata Jalan Masyarakat - Road Asset Intelligence
echo  ================================================
echo.

:: --- Check port 8080 ---
netstat -ano | findstr ":8080 " >nul 2>&1
if %errorlevel%==0 (
    echo  [WARN] Port 8080 sudah dipakai. Django mungkin sudah berjalan.
    echo         Jika tidak, tutup aplikasi yang memakai port 8080 lalu coba lagi.
    echo.
)

:: --- Start Django backend (new window) ---
echo  [1/2] Menjalankan Django backend di http://127.0.0.1:8080 ...
start "Mat(a)Mu Backend" cmd /k "cd /d C:\laragon\www\matamu\matamu-backend && venv\Scripts\python.exe manage.py runserver 8080"

:: --- Wait for Django to start ---
echo  [..] Menunggu backend siap (5 detik)...
timeout /t 5 /nobreak >nul

:: --- Start React PWA frontend (new window) ---
echo  [2/2] Menjalankan React PWA di http://localhost:5173 ...
start "Mat(a)Mu Frontend" cmd /k "cd /d C:\laragon\www\matamu\matamu-frontend && npm run dev"

:: --- Done ---
echo.
echo  ================================================
echo   SELESAI — Dua server berjalan:
echo.
echo   Backend  (Django)  : http://127.0.0.1:8080
echo   Dashboard (Operator): http://127.0.0.1:8080/dashboard/
echo   API Docs            : http://127.0.0.1:8080/api/docs
echo.
echo   Frontend (PWA Warga): http://localhost:5173
echo.
echo   Login dashboard : admin / <redacted-password>
echo  ================================================
echo.
echo  Tekan Enter untuk membuka dashboard di browser...
pause >nul
start "" "http://127.0.0.1:8080/dashboard/"
