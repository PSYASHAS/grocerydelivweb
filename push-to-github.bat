@echo off
title Push FreshCart to GitHub (PSYASHAS)
echo ========================================================
echo   Pushing FreshCart Repository to GitHub
echo   Target: https://github.com/PSYASHAS/grocerydelivweb.git
echo ========================================================
echo.

echo 1. Pushing 'main' branch...
git push -u origin main

echo.
echo 2. Pushing 'develop' branch...
git push origin develop

echo.
echo 3. Pushing 'feature/inventory-and-orders' branch...
git push origin feature/inventory-and-orders

echo.
echo ========================================================
echo   All branches pushed successfully!
echo ========================================================
pause
