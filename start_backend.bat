@echo off
:: CyberCoach Background Startup Script
:: Place this file in: %appdata%\Microsoft\Windows\Start Menu\Programs\Startup
:: This ensures the Python AI engine starts silently every time the laptop boots.

echo Starting CyberCoach Local AI Engine...

:: Navigate to the directory where your python script is saved
cd /d "c:\Users\shrey\OneDrive\Desktop\amd\backend"

:: Run the FastAPI server silently in the background
:: The 'pythonw' command runs python without opening a command prompt window
start /B pythonw local_daemon.py

exit
