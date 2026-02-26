# CyberCoach Local Backend
# =========================
# FastAPI server that acts as the bridge between the browser extension,
# the AI engine (Gemini as NPU fallback), and the React dashboard.
#
# Architecture note: The generate_advice() function is the single point
# where AI inference happens. In production with AMD Ryzen AI hardware,
# replace the Gemini call with ONNX Runtime + VitisAIExecutionProvider.

import sqlite3
import time
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

# --- Gemini SDK (NPU Fallback) ---
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# =============================================================================
# CONFIGURATION
# =============================================================================
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")  # Set via env var or hardcode here
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "local_db.sqlite")
STATIC_DIR = os.path.join(os.path.dirname(BASE_DIR), "dist")
INITIAL_SCORE = 100

# Configure Gemini if available
if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")
else:
    model = None

# =============================================================================
# DATABASE SETUP
# =============================================================================
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            current_score INTEGER DEFAULT 100,
            streak_days INTEGER DEFAULT 0
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL,
            action_type TEXT,
            context TEXT,
            points_changed INTEGER,
            advice TEXT,
            event_category TEXT DEFAULT 'bad'
        )
    """)

    # Ensure user row exists
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (id, current_score, streak_days) VALUES (1, ?, 0)", (INITIAL_SCORE,))

    conn.commit()
    conn.close()

init_db()

# =============================================================================
# FASTAPI APP
# =============================================================================
app = FastAPI(title="CyberCoach Local Daemon", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# REQUEST / RESPONSE MODELS
# =============================================================================
class EventRequest(BaseModel):
    type: str
    url: Optional[str] = ""
    context: Optional[str] = ""

class CoachRequest(BaseModel):
    question: str

# =============================================================================
# AI INFERENCE (Single point of replacement for NPU)
# =============================================================================
async def generate_advice(prompt: str) -> str:
    """
    Generate AI text. This is THE function to swap for NPU inference.

    Production replacement:
        import onnxruntime as ort
        providers = ['VitisAIExecutionProvider', 'CPUExecutionProvider']
        session = ort.InferenceSession("phi3_mini_int8.onnx", providers=providers)
        inputs = {"input_ids": tokenize(prompt)}
        output = session.run(None, inputs)
        return decode(output)
    """
    if model:
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
            return f"⚠️ AI inference failed: {str(e)}"
    else:
        # Hardcoded fallback when no API key is set
        return "🚨 Risk detected! This action could compromise your security. Always verify URLs, avoid HTTP sites for sensitive data, and keep your software updated."

# =============================================================================
# POINT DEDUCTION RULES
# =============================================================================
POINT_RULES = {
    "insecure_login": 10,
    "risky_download": 15,
    "unsecured_network": 5,
    "http_form_submission": 10,
    "sketchy_download": 15,
    "open_wifi": 5,
}

def get_points_for_event(event_type: str) -> int:
    normalized = event_type.lower().replace(" ", "_")
    return POINT_RULES.get(normalized, 10)

# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    return {"status": "online", "service": "CyberCoach Local Daemon", "npu": "Gemini Fallback"}


@app.post("/event")
async def handle_event(event: EventRequest):
    """
    Receives a security event from the browser extension or demo triggers.
    Generates AI advice, deducts points, saves to DB.
    """
    context = event.context or event.url or "Unknown context"
    
    # SPECIAL CASE: Automatic URL Navigation Scan
    if event.type == "url_navigation":
        # AI Scan for Phishing / Deception
        url = event.context
        prompt = (
            f"Analyze this URL for phishing or visual deception: '{url}'. "
            "Check for homograph attacks (e.g. paypa1.com), suspicious subdomains, or misleading naming. "
            "Respond in exactly this format: 'STATUS: [SAFE or SUSPICIOUS] | ADVICE: [1 short sentence]'. "
            "Only mark as SUSPICIOUS if there is a clear sign of fraud."
        )
        ai_response = await generate_advice(prompt)
        
        if "STATUS: SUSPICIOUS" in ai_response:
            advice = ai_response.split("ADVICE:")[1].strip() if "ADVICE:" in ai_response else "🚨 Suspicious URL detected!"
            points = 20  # High penalty for visiting phishing sites
            event_category = "bad"
            action_label = "Phishing Site Detected"
        else:
            # Silently ignore safe URLs to keep DB clean
            return {"status": "safe", "url": url}
    else:
        # Standard Demo/Heuristic Events
        points = get_points_for_event(event.type)
        action_label = event.type
        event_category = "bad"
        prompt = f'Act as an OS-level notification. The user did: "{event.type} - {context}". Write a punchy 1-sentence warning explaining the risk. Start with 🚨.'
        advice = await generate_advice(prompt)

    # Update database
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("UPDATE users SET current_score = MAX(0, current_score - ?) WHERE id = 1", (points,))
    cursor.execute(
        "INSERT INTO events (timestamp, action_type, context, points_changed, advice, event_category) VALUES (?, ?, ?, ?, ?, ?)",
        (time.time(), action_label, context, -points, advice, event_category)
    )
    cursor.execute("SELECT current_score FROM users WHERE id = 1")
    new_score = cursor.fetchone()[0]

    conn.commit()
    conn.close()

    return {
        "advice": advice,
        "points_deducted": points,
        "new_score": new_score,
        "action": action_label
    }


@app.post("/coach")
async def handle_coach(req: CoachRequest):
    """
    Handles AI Coach Studio questions. Returns coaching response.
    """
    prompt = f'You are an on-device cybersecurity coach. The student asks: "{req.question}". Give a friendly, 2-sentence explanation of the risk and what to do. Use an emoji.'
    response = await generate_advice(prompt)
    return {"response": response}


@app.get("/dashboard-data")
async def get_dashboard_data():
    """
    Returns current score, level, and telemetry for the React dashboard.
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT current_score, streak_days FROM users WHERE id = 1")
    user = cursor.fetchone()

    cursor.execute("SELECT * FROM events ORDER BY timestamp DESC LIMIT 10")
    events = cursor.fetchall()

    recent_events = []
    for e in events:
        elapsed = time.time() - e["timestamp"]
        if elapsed < 60:
            time_str = "Just now"
        elif elapsed < 3600:
            time_str = f"{int(elapsed / 60)}m ago"
        elif elapsed < 86400:
            time_str = f"{int(elapsed / 3600)}h ago"
        else:
            time_str = f"{int(elapsed / 86400)}d ago"

        recent_events.append({
            "id": e["id"],
            "text": e["action_type"],
            "points": f"{e['points_changed']:+d}" if e["points_changed"] else "0",
            "type": e["event_category"],
            "time": time_str,
            "advice": e["advice"],
            "context": e["context"]
        })

    conn.close()

    # Calculate Student Level (XP-based)
    score = user["current_score"] if user else INITIAL_SCORE
    level = (score // 20) + 1  # 0-20=L1, 21-40=L2, etc.
    ranks = ["Novice", "Guardian", "Elite", "Sentinel", "Apex Guardian"]
    rank = ranks[min(level - 1, 4)]

    # Simulated Hardware Telemetry
    import random
    npu_usage = random.randint(5, 15) if random.random() > 0.3 else random.randint(30, 85) # Spikes when AI runs
    
    return {
        "score": score,
        "level": level,
        "rank": rank,
        "streak_days": user["streak_days"] if user else 0,
        "recent_events": recent_events,
        "npu_telemetry": {
            "load": npu_usage,
            "temp": 42 + (npu_usage // 10),
            "status": "Optimal" if npu_usage < 80 else "Engaged"
        }
    }


@app.post("/reset")
async def reset_data():
    """
    Resets score and clears events. Useful for demo presentations.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET current_score = ?, streak_days = 0 WHERE id = 1", (INITIAL_SCORE,))
    cursor.execute("DELETE FROM events")
    conn.commit()
    conn.close()
    return {"status": "reset", "score": INITIAL_SCORE}


# --- Static UI Serving (Final Catch-all) ---
@app.get("/")
@app.get("/dashboard")
async def serve_ui():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"status": "error", "message": "Dashboard build not found. Run 'npm run build' in root."}

# Mount assets (CSS, JS) from the dist/assets folder
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")


if __name__ == "__main__":
    import uvicorn
    print("CyberCoach Local Daemon starting on http://127.0.0.1:8000")
    print("Database:", DB_PATH)
    print("AI Engine:", "Gemini API (NPU Fallback)" if model else "Hardcoded Responses (No API Key)")
    uvicorn.run(app, host="127.0.0.1", port=8000)
