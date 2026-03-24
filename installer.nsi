;NSIS Installer for MesterX
Name "MesterX Production"
OutFile "MesterX-Installer.msi"
InstallDir "$PROGRAMFILES\MesterX"

Section
  SetOutPath $INSTDIR
  File /r "backend/publish-api\*.*"
  CreateShortcut "$DESKTOP\MesterX.lnk" "$INSTDIR\MesterX-API.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MesterX" "DisplayName" "MesterX"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MesterX" "UninstallString" "$INSTDIR\uninstall.exe"
SectionEnd
