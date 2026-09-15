@echo off
setlocal
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo Falta Git. Ejecuta scripts\setup-windows.ps1 o instala Git for Windows: https://git-scm.com/download/win
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo Falta Node.js. Ejecuta scripts\setup-windows.ps1 o instala Node.js LTS: https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo ^>^> Primera vez: instalando dependencias. Puede tardar unos minutos...
  call npm ci
  if errorlevel 1 (
    echo Error al instalar las dependencias. Comprueba la conexion a internet y vuelve a intentarlo.
    pause
    exit /b 1
  )
)

echo.
echo ^>^> Iniciando el editor de la carta...
echo ^>^> El navegador se abrira solo en http://localhost:4321
echo ^>^> Cuando termines, cierra esta ventana.
echo.
call npm run dev -- --open
pause
