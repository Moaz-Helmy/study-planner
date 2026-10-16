@echo off
title StudyFlow Desktop Study Planner
set "ELECTRON_RUN_AS_NODE="
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
if not exist "dist\index.html" (
  echo Building StudyFlow production bundle...
  "C:\Program Files\nodejs\node.exe" "node_modules\vite\bin\vite.js" build
)
echo Launching StudyFlow Desktop App...
start "" "%~dp0node_modules\electron\dist\electron.exe" .
