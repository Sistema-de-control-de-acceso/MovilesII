#!/usr/bin/env pwsh
# Backup automático de MongoDB y guardado en Descargas (Windows)

$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm"
$tempDir = "$env:TEMP\mongodb_backup_$fecha"
$destino = "$env:USERPROFILE\Downloads\\mongodb_backup_$fecha.zip"



# Leer la URI de MongoDB desde el archivo .env del backend
$envFile = "c:\Users\HP\Documents\GitHub\MovilesII\backend\.env"
if (-not (Test-Path $envFile)) {
	$envFile = "c:\Users\HP\Documents\GitHub\MovilesII\backend\.env.example"
}
$mongoUri = Select-String -Path $envFile -Pattern '^MONGODB_URI=' | ForEach-Object { $_.Line.Split('=')[1] }
if (-not $mongoUri) {
	Write-Host "ERROR: No se encontró MONGODB_URI en $envFile."
	exit 1
}

# Dump de la base de datos
$dumpResult = mongodump --uri $mongoUri --out $tempDir
if ($LASTEXITCODE -ne 0) {
	Write-Host "ERROR: Falló el backup de MongoDB."
	exit 1
}

# Comprimir en ZIP si el dump fue exitoso
if (Test-Path $tempDir) {
	Compress-Archive -Path $tempDir -DestinationPath $destino
	Remove-Item -Recurse -Force $tempDir
	Write-Host "Backup guardado en: $destino"
} else {
	Write-Host "ERROR: No se encontró el directorio de backup."
	exit 1
}
