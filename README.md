# 🛡️ CyberCoach: Local AI Cybersecurity Mentor

CyberCoach is a full-stack, local-first application designed to act as an on-device cybersecurity mentor. It monitors your browsing behavior in real-time, detects risky actions, and provides immediate, context-aware AI advice to help you learn better security habits—all without sending your personal data to the cloud.

## 🏗️ Architecture

The application consists of three main components that work together:

1. **The Sensor (Chrome Extension)**
   - Lives in your browser (`/extension`)
   - Monitors navigation, form submissions, and downloads.
   - Detects risky behavior (like HTTP password submissions or downloading `.exe` files).
   - Immediately forwards these events to the local backend.

2. **The Brain (FastAPI Local Daemon)**
   - Runs locally on your machine (`/backend/local_daemon.py`)
   - Receives events from the extension.
   - Uses an AI Model (currently Gemini as a placeholder for PC NPUs) to generate punchy, contextual advice based on what you just did.
   - Manages a local SQLite database (`local_db.sqlite`) to track your "Security Score", streak, and event history.

3. **The Dashboard (React + Vite Frontend)**
   - A beautiful, gamified UI (`/src`)
   - Connects to the local daemon to display your current Security Score, your rank (e.g., Novice, Guardian, Elite), and a timeline of recent risky events.
   - Includes an "AI Coach Studio" where you can ask specific cybersecurity questions to the AI mentor.

---

## 🤖 How the AI Works

The AI is designed to run *locally*. The core function `generate_advice()` in the backend is structured so that it can easily be swapped to use an **ONNX Runtime** model running directly on an AMD Ryzen NPU (Neural Processing Unit).

Currently, it uses the Gemini API as a fallback if an API key is provided, or uses hardcoded fallback responses if no key is present, ensuring the app still functions perfectly for offline demonstrations.

### Detection Scenarios
- **Phishing/Deception:** When you navigate to a new URL, the extension sends the URL to the AI. The AI analyzes the URL structure for homograph attacks or suspicious subdomains.
- **Risky Downloads:** If you download an executable (like a `.exe` or `.bat`), the extension intercepts it and triggers the AI to warn you about running untrusted software.
- **Insecure Logins:** Submitting a password over a non-HTTPS (`http://`) connection triggers an immediate penalty and advice on encryption.

---

## 🚀 How to Run the Application

Because this is a multi-part architecture, you need to run the server, the frontend, and load the extension.

### 1. Start the Local AI Backend
The backend needs to run in the background to serve AI responses and manage the database.
- A batch script is provided for Windows users: `start_backend.bat`. Double-clicking this will silently start the Python server (`pythonw`) on port `8000` in the background.
- **Alternatively (Manual):**
  ```bash
  cd backend
  pip install -r requirements.txt
  python local_daemon.py
  ```

### 2. Start the React Dashboard
The frontend provides the visual interface and Gamification features.
```bash
# In the root project directory
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

### 3. Load the Chrome Extension
1. Open Google Chrome or Microsoft Edge and go to `chrome://extensions/`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `extension` folder located inside this project directory.
5. The extension is now active and watching for risky behavior!

---

## 🛠️ Troubleshooting

- **"Connection Refused" when opening the Dashboard:** Ensure the backend FastAPI server is running. Check Task Manager for a `pythonw.exe` process if you used the background script.
- **No notifications appearing when I download a file:**
  1. Ensure Windows "Focus Assist" or "Do Not Disturb" is turned OFF, as Windows will hide Chrome notifications otherwise.
  2. Ensure the extension is enabled (toggle switch is ON) in `chrome://extensions/`.
- **How do I stop the background server?** Open Windows Task Manager, find `pythonw.exe`, and click "End Task".

---
*Built for the AI PC Hackathon - Emphasizing On-Device Processing and Privacy.*
