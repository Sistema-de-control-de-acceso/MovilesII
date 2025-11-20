#!/bin/bash
# Script para analizar el tamaño del APK con bundletool y obtener un reporte detallado

APK_PATH="app/build/outputs/apk/release/app-release.apk"
BUNDLETOOL_JAR="bundletool-all.jar"

if [ ! -f "$APK_PATH" ]; then
  echo "APK no encontrado en $APK_PATH"
  exit 1
fi

if [ ! -f "$BUNDLETOOL_JAR" ]; then
  echo "Descarga bundletool desde https://github.com/google/bundletool/releases"
  exit 1
fi

java -jar $BUNDLETOOL_JAR dump apk --apks=$APK_PATH --output=apk-size-report.txt
cat apk-size-report.txt
