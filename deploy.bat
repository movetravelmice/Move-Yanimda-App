@echo off
chcp 65001 > nul
echo ========================================================
echo   Move Yanımda - Firebase Dağıtım (Deploy) Sihirbazı
echo ========================================================
echo.
echo [1/2] Proje derleniyor (npm run build)...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo.
    echo [HATA] Proje derlenirken hata oluştu!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Firebase Hosting alanına yükleniyor (move-yanimda)...
call npx.cmd -p firebase-tools firebase deploy --only hosting

if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo   [BİLGİ] Firebase oturumunuzun süresi dolmuş olabilir.
    echo   Yeniden giriş yapmak için aşağıdaki komutu çalıştırın:
    echo.
    echo     npx -p firebase-tools firebase login --reauth
    echo ========================================================
    echo.
) else (
    echo.
    echo ========================================================
    echo   ✓ Dağıtım başarıyla tamamlandı!
    echo   Canlı adres: https://move-yanimda.web.app
    echo ========================================================
)

pause
