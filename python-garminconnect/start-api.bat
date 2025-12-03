@echo off
echo ========================================
echo 🚀 Starting Garmin Connect API Server
echo ========================================
echo.

:: Check if virtual environment exists
if exist ".venv\Scripts\activate.bat" (
    echo ✅ Found virtual environment
    call .venv\Scripts\activate.bat
) else (
    echo ⚠️  Virtual environment not found
    echo Creating virtual environment...
    python -m venv .venv --copies
    call .venv\Scripts\activate.bat
)

echo.
echo 📦 Installing dependencies...
pip install -r requirements-api.txt

echo.
echo 🎯 Starting Flask server...
python api_server.py
