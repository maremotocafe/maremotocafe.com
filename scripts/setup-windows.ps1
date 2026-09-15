# Instalación del editor de la carta en Windows.
#
# Uso: abre PowerShell (como usuario normal, no administrador) y pega:
#
#   irm https://raw.githubusercontent.com/maremotocafe/maremotocafe.com/master/scripts/setup-windows.ps1 | iex
#
# Qué hace:
#   1. Instala Git y Node.js LTS con winget (si faltan).
#   2. Descarga el proyecto en C:\Users\<usuario>\maremotocafe.com (fuera de OneDrive).
#   3. Configura el nombre y email con los que se firman los cambios.
#   4. Instala las dependencias del proyecto.
#   5. Crea el acceso directo "Editar carta" en el escritorio.
#
# Se puede ejecutar varias veces sin problema: salta los pasos ya hechos.

# No usamos ErrorActionPreference=Stop: git escribe su progreso en stderr y
# Windows PowerShell lo trataria como error. Comprobamos cada paso a mano.
$PSNativeCommandUseErrorActionPreference = $false

$Repo = "https://github.com/maremotocafe/maremotocafe.com.git"
$Dest = Join-Path $HOME "maremotocafe.com"

function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
    [Environment]::GetEnvironmentVariable("Path", "User")
}

function Install-Tool($Command, $WingetId, $Name, $Url) {
  if (Get-Command $Command -ErrorAction SilentlyContinue) {
    Write-Host "   $Name ya esta instalado."
    return
  }
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "No se encuentra winget. Instala $Name a mano desde $Url y vuelve a ejecutar este script."
  }
  winget install -e --id $WingetId --accept-source-agreements --accept-package-agreements
  Refresh-Path
  if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
    throw "$Name no se ha instalado. Instalalo a mano desde $Url, cierra PowerShell y vuelve a ejecutar este script."
  }
}

Write-Host ">> 1/5 Git"
Install-Tool "git" "Git.Git" "Git" "https://git-scm.com/download/win"
git --version

Write-Host ">> 2/5 Node.js"
Install-Tool "node" "OpenJS.NodeJS.LTS" "Node.js LTS" "https://nodejs.org"
node --version

Write-Host ">> 3/5 Proyecto en $Dest"
if (Test-Path (Join-Path $Dest ".git")) {
  Write-Host "   Ya existe. Actualizando..."
  git -C $Dest pull --ff-only origin master
} else {
  git clone $Repo $Dest
}
if (-not (Test-Path (Join-Path $Dest ".git"))) {
  throw "No se ha podido descargar el proyecto. Comprueba la conexion a internet y vuelve a ejecutar este script."
}
Set-Location $Dest

Write-Host ">> 4/5 Firma de los cambios"
$name = git config user.name
if (-not $name) {
  $name = Read-Host "   Nombre con el que firmar los cambios (p. ej. el nombre del bar)"
  git config user.name $name
}
$email = git config user.email
if (-not $email) {
  $email = Read-Host "   Email con el que firmar los cambios"
  git config user.email $email
}
Write-Host "   Los cambios se firmaran como: $name <$email>"

Write-Host ">> 5/5 Dependencias del proyecto (puede tardar unos minutos)"
npm.cmd ci
if ($LASTEXITCODE -ne 0) {
  throw "npm ci ha fallado. Comprueba la conexion a internet y vuelve a ejecutar este script."
}

$desktop = [Environment]::GetFolderPath("Desktop")
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut((Join-Path $desktop "Editar carta.lnk"))
$shortcut.TargetPath = Join-Path $Dest "Editar carta.cmd"
$shortcut.WorkingDirectory = $Dest
$shortcut.IconLocation = Join-Path $Dest "public\favicon.ico"
$shortcut.Save()

Write-Host ""
Write-Host "Listo. En el escritorio tienes el acceso directo 'Editar carta'."
Write-Host "La primera vez que pulses 'Subir cambios' se abrira una ventana para iniciar sesion en GitHub."
