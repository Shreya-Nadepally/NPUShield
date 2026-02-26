// =============================================================================
// CyberCoach Browser Extension - Background Service Worker
// =============================================================================
// This extension acts as the "sensor" layer of the CyberCoach architecture.
// It monitors browsing behavior using native browser APIs (heuristics, not ML)
// and forwards detected events to the local Python daemon at localhost:8000.
//
// Two detection engines:
//   1. HTTP Password Interceptor - catches password submissions over HTTP
//   2. Sketchy Download Detector - catches potentially dangerous file downloads
// =============================================================================

const API_BASE = "http://127.0.0.1:8000";

// =============================================================================
// HELPER: Send event to local daemon
// =============================================================================
async function sendEventToDaemon(eventType, context) {
    try {
        const response = await fetch(`${API_BASE}/event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: eventType,
                context: context
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`[CyberCoach] Event sent: ${eventType}`, data);

            // Show Chrome notification with AI advice
            if (data.advice) {
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
                    title: "🛡️ CyberCoach Alert",
                    message: data.advice.substring(0, 200),
                    priority: 2
                });
            }
        }
    } catch (error) {
        console.warn("[CyberCoach] Local daemon offline:", error.message);
    }
}

// =============================================================================
// SENSOR 1: HTTP Password Interceptor
// =============================================================================
// Detects POST requests to http:// (non-HTTPS) URLs that contain form data
// with password fields. This catches insecure login submissions.
// =============================================================================
chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        // Only flag non-HTTPS POST requests
        if (details.url.startsWith("http://") && details.method === "POST") {
            // Check if the request body contains password-related fields
            const bodyStr = JSON.stringify(details.requestBody || {});

            if (
                bodyStr.toLowerCase().includes("password") ||
                bodyStr.toLowerCase().includes("passwd") ||
                bodyStr.toLowerCase().includes("pass") ||
                bodyStr.toLowerCase().includes("pwd")
            ) {
                console.log(`[CyberCoach] 🚨 Insecure password submission detected: ${details.url}`);

                sendEventToDaemon(
                    "insecure_login",
                    `Password submitted over HTTP to ${details.url}`
                );
            }
        }
    },
    { urls: ["<all_urls>"] },
    ["requestBody"]
);

// =============================================================================
// SENSOR 2: Sketchy Download Detector
// =============================================================================
// Monitors file downloads and flags potentially dangerous file extensions
// like .exe, .scr, .bat, .cmd, .msi, .vbs, .ps1
// =============================================================================
const RISKY_EXTENSIONS = [
    ".exe", ".scr", ".bat", ".cmd", ".msi",
    ".vbs", ".ps1", ".jar", ".com", ".pif"
];

chrome.downloads.onCreated.addListener((downloadItem) => {
    // Some downloads don't have a filename immediately (like redirects)
    // We check the URL as a fallback, and ignore case
    const url = (downloadItem.url || "").toLowerCase();
    const finalUrl = (downloadItem.finalUrl || "").toLowerCase();
    const filename = (downloadItem.filename || "").toLowerCase();

    const targetString = filename || finalUrl || url;
    const isRisky = RISKY_EXTENSIONS.some(ext => targetString.includes(ext));

    console.log(`[CyberCoach] Download Started! Checking: ${targetString}`);

    if (isRisky) {
        console.log(`[CyberCoach] 🚨 Risky download detected!`);

        sendEventToDaemon(
            "risky_download",
            `Downloaded suspicious file: ${targetString}`
        );
    }
});

// =============================================================================
// SENSOR 3: Automatic URL Scanner
// =============================================================================
// Monitors every navigation event and sends the URL to the backend for
// real-time AI analysis. Uses a simple cache to avoid re-scanning.
// =============================================================================
const scannedUrls = new Set();

chrome.webNavigation.onCommitted.addListener((details) => {
    // Only care about top-level frame navigation
    if (details.frameId !== 0) return;

    const url = details.url;

    // Skip browser internal pages and local development
    if (url.startsWith("chrome://") || url.startsWith("about:") || url.includes("localhost") || url.includes("127.0.0.1")) {
        return;
    }

    // Basic de-duplication to avoid flooding
    if (scannedUrls.has(url)) return;
    scannedUrls.add(url);
    if (scannedUrls.size > 100) scannedUrls.delete([...scannedUrls][0]); // Keep cache small

    console.log(`[CyberCoach] 🔍 Automatically scanning URL: ${url}`);

    // Send to backend as a 'url_navigation' event
    sendEventToDaemon("url_navigation", url);
});

// =============================================================================
// LIFECYCLE
// =============================================================================
chrome.runtime.onInstalled.addListener(() => {
    console.log("[CyberCoach] Extension installed. Sensors active.");
});
