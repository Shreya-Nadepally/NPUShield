import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, ShieldAlert, Cpu, Brain, Activity,
  Wifi, AlertTriangle, CheckCircle,
  Send, Loader2, X, Download, Globe,
  Settings, Home, BookOpen, RotateCcw,
  Zap, ChevronRight, BarChart3, Terminal,
  Lock, ArrowUpCircle, Layers
} from 'lucide-react';

// =============================================================================
// CyberCoach Premium UI overhaul - Student Edition
// =============================================================================
const API_BASE = "http://127.0.0.1:8000";

import { NavButton } from './components/NavButton';
import { StatCard } from './components/StatCard';

export default function CyberApp() {
  const [activeTab, setActiveTab] = useState('hub');
  const [data, setData] = useState({
    score: 100,
    level: 1,
    rank: "Novice",
    streak_days: 0,
    recent_events: [],
    npu_telemetry: { load: 0, temp: 40, status: "Standby" }
  });
  const [systemAlert, setSystemAlert] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [coachInput, setCoachInput] = useState("");
  const [coachOutput, setCoachOutput] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);

  // Polling logic
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard-data`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 3000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // Alert cleanup
  useEffect(() => {
    if (systemAlert) {
      const timer = setTimeout(() => setSystemAlert(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [systemAlert]);

  const handleAskCoach = async () => {
    if (!coachInput.trim()) return;
    setCoachLoading(true);
    try {
      const res = await fetch(`${API_BASE}/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: coachInput })
      });
      const resData = await res.json();
      setCoachOutput(resData.response);
    } catch {
      setCoachOutput("⚠️ AI Core disconnected. Start the local daemon.");
    }
    setCoachLoading(false);
  };

  const triggerEvent = async (type, context) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context })
      });
      const resData = await res.json();
      setSystemAlert({ type, advice: resData.advice });
      fetchDashboard();
    } catch (e) {
      console.error(e);
    }
    setIsProcessing(false);
  };

  const handleReset = async () => {
    await fetch(`${API_BASE}/reset`, { method: 'POST' });
    fetchDashboard();
    setCoachOutput("");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans flex selection:bg-blue-500/30">

      {/* 1. OS Alert Overlay */}
      {systemAlert && (
        <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-10 fade-in duration-500">
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-rose-500/30 p-5 rounded-2xl shadow-2xl shadow-rose-500/10 max-w-sm border-l-4 border-l-rose-500">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-rose-500/20 p-1.5 rounded-lg text-rose-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-white font-black text-xs uppercase tracking-tighter">Threat Detected</span>
              </div>
              <button onClick={() => setSystemAlert(null)}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
            </div>
            <p className="text-sm font-bold text-rose-200 mb-2 truncate">{systemAlert.type.replace(/_/g, ' ')}</p>
            <p className="text-xs text-slate-300 leading-relaxed">{systemAlert.advice}</p>
          </div>
        </div>
      )}

      {/* 2. Sidebar Navigation */}
      <aside className="w-72 border-r border-slate-800/50 bg-slate-900/20 backdrop-blur-xl flex flex-col p-6 sticky h-screen top-0">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="relative">
            <Shield className="w-8 h-8 text-blue-500" />
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20" />
          </div>
          <div>
            <h1 className="text-white font-black tracking-tighter text-xl">CYBERCOACH</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500 pulse' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                {backendOnline ? "System Online" : "System Offline"}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          <NavButton active={activeTab === 'hub'} icon={Home} label="Security Hub" onClick={() => setActiveTab('hub')} color="blue" />
          <NavButton active={activeTab === 'coach'} icon={Brain} label="AI Coach Studio" onClick={() => setActiveTab('coach')} color="emerald" />
          <NavButton active={activeTab === 'sandbox'} icon={ShieldAlert} label="Training Ground" onClick={() => setActiveTab('sandbox')} color="rose" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800/50">
          <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Hardware NPU</span>
              <Cpu className={`w-4 h-4 ${backendOnline ? 'text-blue-500 animate-pulse' : 'text-slate-600'}`} />
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-1000 ${backendOnline ? '' : 'w-0'}`}
                style={{ width: `${data.npu_telemetry.load}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>{data.npu_telemetry.load}% Load</span>
              <span>{data.npu_telemetry.temp}°C</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 3. Main Content */}
      <main className="flex-1 p-10 max-w-7xl mx-auto w-full relative">
        {/* Header Decals */}
        <div className="absolute top-0 right-0 p-10 opacity-20 pointer-events-none w-1/3 h-1/3">
          <div className="w-full h-full border-t-2 border-r-2 border-blue-500/30 rounded-tr-[50px] relative">
            <div className="absolute top-4 right-4 text-[10px] font-mono text-blue-500 vertical-text select-none">SYSTEM_STATUS_v3.2</div>
          </div>
        </div>

        {/* --- HUB TAB --- */}
        {activeTab === 'hub' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <header className="mb-10 flex justify-between items-end">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-4xl font-black text-white tracking-tighter">Security Overview</h2>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">AI Live Scan Active</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm">Your on-device cybersecurity performance report.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleReset} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors" title="Emergency Reset">
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Security XP" value={data.score} subValue="Points to next level" icon={Zap} color="blue" />
              <StatCard label="Current Level" value={`LVL ${data.level}`} subValue={data.rank} icon={ArrowUpCircle} color="emerald" />
              <StatCard label="NPU Status" value={data.npu_telemetry.status} subValue="Processing Locally" icon={Cpu} color="indigo" />
              <StatCard label="Active Streak" value={`${data.streak_days} Days`} subValue="Safe Browsing" icon={Activity} color="orange" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Activity Timeline */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white tracking-tighter flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-blue-500" /> Recent Events
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-800 px-2 py-1 rounded">Last 10 Actions</span>
                </div>

                <div className="space-y-3">
                  {data.recent_events.length === 0 ? (
                    <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-20 text-center">
                      <Lock className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No threats detected yet</p>
                      <p className="text-slate-600 text-xs mt-1">Your shield is holding firm.</p>
                    </div>
                  ) : (
                    data.recent_events.map((ev, idx) => (
                      <div key={ev.id} className="group relative bg-slate-900/50 border border-slate-800 p-4 rounded-2xl hover:border-blue-500/30 transition-all duration-300">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <div className={`p-3 rounded-xl ${ev.type === 'bad' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                              {ev.type === 'bad' ? <ShieldAlert className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                            </div>
                            <div>
                              <h4 className="text-white font-bold text-sm tracking-tight capitalize">{ev.text.replace(/_/g, ' ')}</h4>
                              <p className="text-xs text-slate-500 mb-2">{ev.time} • {ev.context}</p>
                              {ev.advice && (
                                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 group-hover:border-blue-500/20">
                                  <p className="text-blue-200 text-xs italic">" {ev.advice} "</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`text-sm font-black p-2 rounded-lg ${ev.points.startsWith('-') ? 'text-rose-400 bg-rose-400/5' : 'text-emerald-400 bg-emerald-400/5'}`}>
                            {ev.points} XP
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sidebar Info Card */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                  <div className="relative z-10">
                    <h3 className="text-white font-black text-2xl tracking-tighter mb-4">Protect Your Level</h3>
                    <p className="text-blue-100 text-sm leading-relaxed mb-6">Every risky behavior detected by the <strong>Extension Sensor</strong> costs you XP and lowers your rank.</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs font-bold text-blue-200">
                        <div className="w-1.5 h-1.5 bg-blue-300 rounded-full" /> Insecure logins: -10 XP
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-blue-200">
                        <div className="w-1.5 h-1.5 bg-blue-300 rounded-full" /> Sketchy downloads: -15 XP
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                  <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" /> System Architecture
                  </h4>
                  <div className="space-y-4">
                    {[
                      { l: "Frontend", r: "React + Tailwind v4" },
                      { l: "Compute", r: "Local AMD NPU" },
                      { l: "Storage", r: "Encrypted SQLite" },
                      { l: "Model", r: "Phi-3-Mini (INT8)" }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-500">{item.l}</span>
                        <span className="text-xs font-mono text-blue-400">{item.r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- COACH TAB --- */}
        {activeTab === 'coach' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <header className="text-center mb-10">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/10 border border-emerald-500/20">
                <Brain className="w-10 h-10" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-2">AI Coach Studio</h2>
              <p className="text-slate-400 text-sm">Real-time local guidance for all your security questions.</p>
            </header>

            <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-8 min-h-[400px] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-6 mb-8">
                {coachOutput ? (
                  <div className="animate-in slide-in-from-left-5 duration-300">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl rounded-tl-none p-5 text-blue-50">
                        <p className="text-sm leading-relaxed">{coachOutput}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 py-12">
                    <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest opacity-50 text-center">Ready for your questions.<br /><span className="lowercase font-normal opacity-50">Ask about phishing, passwords, or encryption.</span></p>
                  </div>
                )}
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-500" />
                <div className="relative flex gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                  <input
                    value={coachInput}
                    onChange={e => setCoachInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAskCoach()}
                    placeholder="Type your security question here..."
                    className="flex-1 bg-transparent border-none text-white px-4 py-3 text-sm focus:ring-0 outline-none"
                  />
                  <button
                    disabled={coachLoading || !coachInput}
                    onClick={handleAskCoach}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-black text-sm"
                  >
                    {coachLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- SANDBOX TAB --- */}
        {activeTab === 'sandbox' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-5 duration-500">
            <header className="mb-10 text-center">
              <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Training Ground</h2>
              <p className="text-slate-400 text-sm">Simulate risky scenarios to see how CyberCoach protects you.</p>
            </header>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { id: "insecure_login", title: "Insecure Login", desc: "Submit password over HTTP", icon: Globe, color: "rose" },
                { id: "risky_download", title: "Malware Trap", desc: "Download unknown .exe file", icon: Download, color: "orange" },
                { id: "unsecured_network", title: "Public Wi-Fi", desc: "Connect without protection", icon: Wifi, color: "blue" }
              ].map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] flex flex-col items-center text-center group hover:border-slate-700 transition-all duration-300">
                  <div className={`w-16 h-16 rounded-2xl bg-${item.color}-500/10 text-${item.color}-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-white font-black text-lg mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 mb-8 leading-relaxed">{item.desc}</p>
                  <button
                    onClick={() => triggerEvent(item.id, `Training simulation: ${item.title}`)}
                    disabled={isProcessing}
                    className="mt-auto w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors border border-slate-700"
                  >
                    {isProcessing ? "Deploying..." : "Run Scenario"}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 p-8 rounded-[2.5rem] mt-12 flex items-center gap-8">
              <div className="hidden md:block">
                <div className="w-32 h-32 rounded-3xl border-2 border-blue-500/20 flex items-center justify-center p-6 relative">
                  <Shield className="w-full h-full text-blue-500/40" />
                  <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-5" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-black text-xl mb-4">Why train here?</h3>
                <p className="text-sm text-slate-400 leading-relaxed">By simulating attacks in this safe environment, you train the <strong>Local NPU</strong> to recognize your behavior patterns. All data stays on your machine, building a personalized shield that gets stronger every day.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
