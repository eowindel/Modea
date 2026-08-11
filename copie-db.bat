@echo off
cd /d "%~dp0"

if not exist "nouveau-modele.db" (
    echo ERREUR : le fichier "nouveau-modele.db" est introuvable dans ce dossier.
    echo Emplacement verifie : "%~dp0"
    pause
    exit /b 1
)

copy /Y "nouveau-modele.db" "mdm-donnees.db"

if %errorlevel% equ 0 (
    echo Copie reussie : nouveau-modele.db  -^>  mdm-donnees.db
) else (
    echo ECHEC de la copie.
)

pause