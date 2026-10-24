@echo off
setlocal
rem A packaged build ships mcode-tools as its own executable beside this launcher;
rem a source or npm checkout ships mcode-tools.js and needs the runtime that the
rem host injects through __MAVIS_MCODE_TOOLS_RUNTIME_EXECUTABLE.
if exist "%~dp0..\mcode-tools.exe" (
  "%~dp0..\mcode-tools.exe" %*
  exit /b %errorlevel%
)
if not defined __MAVIS_MCODE_TOOLS_RUNTIME_EXECUTABLE (
  echo MCode mcode-tools runtime is unavailable. Restart MCode. 1>&2
  exit /b 1
)
"%__MAVIS_MCODE_TOOLS_RUNTIME_EXECUTABLE%" "%~dp0..\mcode-tools.js" %*
exit /b %errorlevel%
